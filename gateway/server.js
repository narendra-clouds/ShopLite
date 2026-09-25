const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = 8080;

app.use(cors());

app.get("/health", (req, res) => {
  res.json({ service: "api-gateway", status: "UP", message: "API Gateway is running" });
});

const proxy = (target, pathFilter) => createProxyMiddleware({
  target,
  changeOrigin: true,
  pathFilter,
  on: {
    error: (error, req, res) => {
      console.error(`Gateway proxy error for ${req.method} ${req.originalUrl}:`, error.message);
      if (!res.headersSent) {
        res.status(503);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({
          message: "The requested ShopLite service is unavailable. Make sure all backend services are running.",
          serviceUnavailable: true,
        }));
      }
    },
  },
});

app.use(proxy("http://127.0.0.1:3002", ["/products", "/admin/products"]));
app.use(proxy("http://127.0.0.1:3003", ["/orders"]));
app.use(proxy("http://127.0.0.1:3004", ["/notifications"]));
app.use(proxy("http://127.0.0.1:3005", ["/reviews"]));
app.use(proxy("http://127.0.0.1:3001", ["/users", "/register", "/login", "/logout", "/validate-token"]));

app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});
