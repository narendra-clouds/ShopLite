const express = require("express");

const app = express();
const PORT = 3003;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3004";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3002";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || "shoplite-internal-dev-key";

app.use(express.json());

const orders = [];

const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) return res.status(401).json({ message: "Authentication required" });
  try {
    const response = await fetch(`${USER_SERVICE_URL}/validate-token`, { headers: { Authorization: authorization } });
    if (!response.ok) return res.status(401).json({ message: "Invalid authentication" });
    const data = await response.json();
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

  for (const item of items) {
    if (!item.productId || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
      return res.status(400).json({ message: "Each item must contain a valid productId and positive integer quantity" });
    }
  }

  const requiredAddressFields = ["fullName", "phone", "address", "city", "state", "pincode"];
  if (!deliveryAddress || requiredAddressFields.some((field) => !String(deliveryAddress[field] ?? "").trim())) {
    return res.status(400).json({ message: "A complete delivery address is required" });
  }

  const reserved = [];
  try {
    for (const item of items) {
      const productResponse = await fetch(`${PRODUCT_SERVICE_URL}/products/${item.productId}`);
      if (!productResponse.ok) throw new Error(`Product ${item.productId} not found`);
      const productData = await productResponse.json();
      if (Number(item.quantity) > Number(productData.product.stock)) {
        return res.status(409).json({ message: `Insufficient stock for ${productData.product.name}. Only ${productData.product.stock} available.` });
      }
    }

    for (const item of items) {
      const stockResponse = await fetch(`${PRODUCT_SERVICE_URL}/products/${item.productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-shoplite-internal-key": INTERNAL_SERVICE_KEY },
        body: JSON.stringify({ quantity: Number(item.quantity), operation: "DECREASE" }),
      });
      if (!stockResponse.ok) {
        const data = await stockResponse.json().catch(() => ({}));
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
          body: JSON.stringify({ quantity: Number(item.quantity), operation: "INCREASE" }),
        });
      } catch (rollbackError) {
        console.error("Inventory rollback failed:", rollbackError.message);
      }
    }
    console.error("Inventory validation/reservation failed:", error.message);
    return res.status(409).json({ message: error.message || "Unable to reserve inventory" });
  }

  const newOrder = {
    id: orders.length + 1,
    userId: req.user.id,
    items: items.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })),
    deliveryAddress,
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

app.patch("/orders/:id/status", authenticate, requireAdmin, (req, res) => {
  const order = orders.find((item) => String(item.id) === String(req.params.id));
  if (!order) return res.status(404).json({ message: "Order not found" });
  const allowed = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: `Status must be one of: ${allowed.join(", ")}` });
  order.status = req.body.status;
  res.json({ message: "Order status updated", order });
});

app.listen(PORT, () => {
  console.log(`Order Service running on http://localhost:${PORT}`);
});
