const express = require("express");

const app = express();
const PORT = 3003;
const NOTIFICATION_SERVICE_URL = "http://localhost:3004";

app.use(express.json());

const orders = [];

app.get("/health", (req, res) => {
  res.json({
    service: "order-service",
    status: "UP",
    message: "Order Service is running"
  });
});

app.get("/orders", (req, res) => {
  const requestedUserId = req.query.userId;
  const result = requestedUserId
    ? orders.filter((order) => String(order.userId) === String(requestedUserId))
    : orders;

  res.json({ orders: result });
});

app.post("/orders", async (req, res) => {
  const { userId, items, deliveryAddress, location } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "At least one order item is required"
    });
  }

  for (const item of items) {
    if (!item.productId || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
      return res.status(400).json({
        message: "Each item must contain a valid productId and positive integer quantity"
      });
    }
  }

  const requiredAddressFields = ["fullName", "phone", "address", "city", "state", "pincode"];
  if (
    !deliveryAddress ||
    requiredAddressFields.some(
      (field) => !String(deliveryAddress[field] ?? "").trim()
    )
  ) {
    return res.status(400).json({
      message: "A complete delivery address is required"
    });
  }

  const newOrder = {
    id: orders.length + 1,
    userId,
    items: items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity)
    })),
    deliveryAddress,
    location: location || null,
    status: "PLACED",
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);

  try {
    const notificationResponse = await fetch(
      `${NOTIFICATION_SERVICE_URL}/notifications`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          orderId: newOrder.id,
          message: `Your order #${newOrder.id} has been placed successfully`
        })
      }
    );

    if (!notificationResponse.ok) {
      console.error("Notification Service returned:", notificationResponse.status);
    }
  } catch (error) {
    console.error("Notification Service error:", error.message);
  }

  return res.status(201).json({
    message: "Order placed successfully",
    order: newOrder
  });
});

app.listen(PORT, () => {
  console.log(`Order Service running on http://localhost:${PORT}`);
});
