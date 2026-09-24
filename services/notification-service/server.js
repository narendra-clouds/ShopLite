const express = require("express");

const app = express();

const PORT = 3004;

app.use(express.json());


// ==========================================
// TEMPORARY IN-MEMORY NOTIFICATIONS
// ==========================================

const notifications = [];


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/health", (req, res) => {
  res.json({
    service: "notification-service",
    status: "UP",
    message: "Notification Service is running"
  });
});


// ==========================================
// GET ALL NOTIFICATIONS
// ==========================================

app.get("/notifications", (req, res) => {
  res.json({
    notifications
  });
});


// ==========================================
// CREATE NOTIFICATION
// ==========================================

app.post("/notifications", (req, res) => {

  const {
    userId,
    orderId,
    message
  } = req.body;


  // ------------------------------------------
  // Validation
  // ------------------------------------------

  if (!userId) {
    return res.status(400).json({
      message: "userId is required"
    });
  }

  if (!orderId) {
    return res.status(400).json({
      message: "orderId is required"
    });
  }


  // ------------------------------------------
  // Create notification
  // ------------------------------------------

  const newNotification = {
    id: notifications.length + 1,

    userId,

    orderId,

    message:
      message ||
      `Your order #${orderId} has been placed successfully`,

    type: "ORDER_CONFIRMATION",

    status: "SENT",

    createdAt: new Date().toISOString()
  };


  notifications.push(newNotification);


  // ------------------------------------------
  // Response
  // ------------------------------------------

  res.status(201).json({
    message: "Notification created successfully",
    notification: newNotification
  });

});


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

  console.log(
    `Notification Service running on http://localhost:${PORT}`
  );

});