const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.use(cors());

const PORT = 8080;

// Gateway health check
app.get("/health", (req, res) => {
  res.json({
    service: "api-gateway",
    status: "UP",
    message: "API Gateway is running"
  });
});

// Product Service
app.use(
  createProxyMiddleware({
    target: "http://127.0.0.1:3002",
    changeOrigin: true,
    pathFilter: "/products"
  })
);

// Order Service
app.use(
  createProxyMiddleware({
    target: "http://127.0.0.1:3003",
    changeOrigin: true,
    pathFilter: "/orders"
  })
);

// Notification Service
app.use(
  createProxyMiddleware({
    target: "http://127.0.0.1:3004",
    changeOrigin: true,
    pathFilter: "/notifications"
  })
);

// User Service
app.use(
  createProxyMiddleware({
    target: "http://127.0.0.1:3001",
    changeOrigin: true,
    pathFilter: ["/users", "/register", "/login"]
  })
);

app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});