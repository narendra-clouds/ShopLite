const express = require("express");

const app = express();
const PORT = 3003;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://127.0.0.1:3004";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://127.0.0.1:3002";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://127.0.0.1:3001";
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || "shoplite-internal-dev-key";

app.use(express.json({ limit: "6mb" }));

const readJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { return { message: text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || `HTTP ${response.status}` }; }
};

const orders = [];

const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) return res.status(401).json({ message: "Authentication required" });
  try {
    const response = await fetch(`${USER_SERVICE_URL}/validate-token`, { headers: { Authorization: authorization } });
    if (!response.ok) return res.status(401).json({ message: "Invalid authentication" });
    const data = await readJsonResponse(response);
    if (!data.user?.id) return res.status(401).json({ message: data.message || "Invalid authentication response" });
    req.user = data.user;
    req.authorization = authorization;
    next();
  } catch (error) {
    console.error("Authentication validation failed:", error.message);
    res.status(503).json({ message: "Authentication service unavailable" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ message: "Admin access required" });
  next();
};

app.get("/health", (req, res) => {
  res.json({ service: "order-service", status: "UP", message: "Order Service is running" });
});

app.get("/orders", authenticate, (req, res) => {
  const result = req.user.role === "ADMIN"
    ? orders
    : orders.filter((order) => String(order.userId) === String(req.user.id));
  res.json({ orders: result });
});

app.post("/orders", authenticate, async (req, res) => {
  const { items, deliveryAddress, location } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "At least one order item is required" });
  }

  const normalizedItems = items.map((item) => ({
    productId: Number(item.productId),
    quantity: Number(item.quantity),
  }));

  if (normalizedItems.some((item) => !Number.isInteger(item.productId) || item.productId <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
    return res.status(400).json({ message: "Each item must contain a valid productId and positive integer quantity" });
  }

  const requiredAddressFields = ["fullName", "phone", "address", "city", "state", "pincode"];
  if (!deliveryAddress || requiredAddressFields.some((field) => !String(deliveryAddress[field] ?? "").trim())) {
    return res.status(400).json({ message: "A complete delivery address is required" });
  }

  // Combine duplicate product lines before checking/reserving stock.
  const quantityByProduct = new Map();
  for (const item of normalizedItems) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) || 0) + item.quantity);
  }

  const reserved = [];
  const productSnapshots = [];
  try {
    for (const [productId, requestedQuantity] of quantityByProduct.entries()) {
      const productResponse = await fetch(`${PRODUCT_SERVICE_URL}/products/${productId}`);
      if (!productResponse.ok) throw new Error(`Product ${productId} not found`);
      const productData = await readJsonResponse(productResponse);
      const product = productData.product;
      if (requestedQuantity > Number(product.stock)) {
        throw new Error(`Insufficient stock for ${product.name}. Only ${product.stock} available.`);
      }
      productSnapshots.push({
        productId,
        name: product.name,
        price: Number(product.price),
        image: product.image || "",
        quantity: requestedQuantity,
      });
    }

    for (const item of productSnapshots) {
      const stockResponse = await fetch(`${PRODUCT_SERVICE_URL}/products/${item.productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-shoplite-internal-key": INTERNAL_SERVICE_KEY },
        body: JSON.stringify({ quantity: item.quantity, operation: "DECREASE" }),
      });
      if (!stockResponse.ok) {
        const data = await readJsonResponse(stockResponse);
        throw new Error(data.message || "Unable to reserve stock");
      }
      reserved.push(item);
    }
  } catch (error) {
    for (const item of reserved) {
      try {
        await fetch(`${PRODUCT_SERVICE_URL}/products/${item.productId}/stock`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-shoplite-internal-key": INTERNAL_SERVICE_KEY },
          body: JSON.stringify({ quantity: item.quantity, operation: "INCREASE" }),
        });
      } catch (rollbackError) {
        console.error("Inventory rollback failed:", rollbackError.message);
      }
    }
    console.error("Inventory validation/reservation failed:", error.message);
    return res.status(409).json({ message: error.message || "Unable to reserve inventory" });
  }

  const orderItems = productSnapshots.map((item) => ({
    productId: item.productId,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
    lineTotal: item.price * item.quantity,
  }));
  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = subtotal;

  const newOrder = {
    id: orders.length ? Math.max(...orders.map((order) => order.id)) + 1 : 1,
    userId: req.user.id,
    customerName: req.user.name,
    customerEmail: req.user.email,
    items: orderItems,
    subtotal,
    total,
    deliveryAddress: {
      fullName: String(deliveryAddress.fullName).trim(),
      phone: String(deliveryAddress.phone).trim(),
      address: String(deliveryAddress.address).trim(),
      city: String(deliveryAddress.city).trim(),
      state: String(deliveryAddress.state).trim(),
      pincode: String(deliveryAddress.pincode).trim(),
    },
    location: location || null,
    status: "PLACED",
    createdAt: new Date().toISOString(),
  };

  orders.push(newOrder);

  try {
    const notificationResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: req.user.id,
        orderId: newOrder.id,
        message: `Your order #${newOrder.id} has been placed successfully`,
      }),
    });
    if (!notificationResponse.ok) console.error("Notification Service returned:", notificationResponse.status);
  } catch (error) {
    console.error("Notification Service error:", error.message);
  }

  return res.status(201).json({ message: "Order placed successfully", order: newOrder });
});

const cancellableStatuses = ["PLACED", "CONFIRMED", "PACKED"];

const restoreOrderStock = async (order) => {
  const restored = [];
  try {
    for (const item of order.items || []) {
      const response = await fetch(`${PRODUCT_SERVICE_URL}/products/${item.productId}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-shoplite-internal-key": INTERNAL_SERVICE_KEY,
        },
        body: JSON.stringify({ quantity: Number(item.quantity), operation: "INCREASE" }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Unable to restore stock for product ${item.productId}`);
      }
      restored.push(item);
    }
  } catch (error) {
    // Best-effort rollback so a partial cancellation does not restore only some items.
    for (const item of restored.reverse()) {
      try {
        await fetch(`${PRODUCT_SERVICE_URL}/products/${item.productId}/stock`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-shoplite-internal-key": INTERNAL_SERVICE_KEY,
          },
          body: JSON.stringify({ quantity: Number(item.quantity), operation: "DECREASE" }),
        });
      } catch (rollbackError) {
        console.error("Cancellation stock rollback failed:", rollbackError.message);
      }
    }
    throw error;
  }
};

const cancelOrder = async (order, cancelledBy) => {
  if (order.status === "CANCELLED") throw new Error("Order is already cancelled.");
  if (!cancellableStatuses.includes(order.status)) {
    throw new Error(`Order cannot be cancelled after it reaches ${order.status}.`);
  }
  if (order.cancellationInProgress) {
    throw new Error("Cancellation is already being processed for this order.");
  }

  order.cancellationInProgress = true;
  try {
    await restoreOrderStock(order);
    order.status = "CANCELLED";
    order.cancelledAt = new Date().toISOString();
    order.cancelledBy = cancelledBy;
  } finally {
    delete order.cancellationInProgress;
  }
};

app.patch("/orders/:id/cancel", authenticate, async (req, res) => {
  const order = orders.find((item) => String(item.id) === String(req.params.id));
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (String(order.userId) !== String(req.user.id)) return res.status(403).json({ message: "You can only cancel your own orders" });

  try {
    await cancelOrder(order, "CUSTOMER");
    try {
      await fetch(`${NOTIFICATION_SERVICE_URL}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: req.user.id,
          orderId: order.id,
          message: `Your order #${order.id} has been cancelled`,
        }),
      });
    } catch (notificationError) {
      console.error("Cancellation notification failed:", notificationError.message);
    }
    return res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (error) {
    return res.status(409).json({ message: error.message || "Unable to cancel order" });
  }
});

app.patch("/orders/:id/status", authenticate, requireAdmin, async (req, res) => {
  const order = orders.find((item) => String(item.id) === String(req.params.id));
  if (!order) return res.status(404).json({ message: "Order not found" });
  const allowed = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: `Status must be one of: ${allowed.join(", ")}` });

  if (order.status === "CANCELLED" && req.body.status !== "CANCELLED") {
    return res.status(409).json({ message: "A cancelled order cannot be reopened" });
  }

  if (req.body.status === "CANCELLED") {
    try {
      await cancelOrder(order, "ADMIN");
    } catch (error) {
      return res.status(409).json({ message: error.message || "Unable to cancel order" });
    }
  } else {
    order.status = req.body.status;
  }

  return res.status(200).json({ message: "Order status updated", order });
});

app.listen(PORT, () => {
  console.log(`Order Service running on http://localhost:${PORT}`);
});
