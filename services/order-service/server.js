const express = require("express");

const app = express();

const PORT = 3003;
const NOTIFICATION_SERVICE_URL = "http://localhost:3004";

app.use(express.json());


// ==========================================
// TEMPORARY IN-MEMORY ORDERS
// ==========================================

const orders = [];


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/health", (req, res) => {
  res.json({
    service: "order-service",
    status: "UP",
    message: "Order Service is running"
  });
});


// ==========================================
// GET ALL ORDERS
// ==========================================

app.get("/orders", (req, res) => {
  res.json({
    orders
  });
});


// ==========================================
// CREATE ORDER
// ==========================================

app.post("/orders", async (req, res) => {

  const { userId, items } = req.body;


  // ------------------------------------------
  // Validate user
  // ------------------------------------------

  if (!userId) {
    return res.status(400).json({
      message: "userId is required"
    });
  }


  // ------------------------------------------
  // Validate items
  // ------------------------------------------

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "At least one order item is required"
    });
  }


  // ------------------------------------------
  // Validate every item
  // ------------------------------------------

  for (const item of items) {

    if (!item.productId || !item.quantity) {
      return res.status(400).json({
        message: "Each item must contain productId and quantity"
      });
    }

    if (item.quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0"
      });
    }

  }


  // ------------------------------------------
  // Create order
  // ------------------------------------------

  const newOrder = {

    id: orders.length + 1,

    userId,

    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    })),

    status: "PLACED",

    createdAt: new Date().toISOString()

  };


  // Save order

  orders.push(newOrder);


  // ==========================================
  // SEND NOTIFICATION
  // ==========================================

  try {

    const notificationResponse = await fetch(
      `${NOTIFICATION_SERVICE_URL}/notifications`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          userId: userId,

          orderId: newOrder.id,

          message:
            `Your order #${newOrder.id} has been placed successfully`

        })
      }
    );


    const notificationData =
      await notificationResponse.json();


    console.log(
      "Notification Service response:",
      notificationData
    );


  } catch (error) {

    console.error(
      "Notification Service error:",
      error.message
    );

  }


  // ==========================================
  // SEND ORDER RESPONSE
  // ==========================================

  res.status(201).json({

    message: "Order placed successfully",

    order: newOrder

  });

});


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

  console.log(
    `Order Service running on http://localhost:${PORT}`
  );

});