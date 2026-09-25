const express = require("express");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT || 8080);

const SERVICES = {
  USER: process.env.USER_SERVICE_URL || "http://127.0.0.1:3001",
  PRODUCT: process.env.PRODUCT_SERVICE_URL || "http://127.0.0.1:3002",
  ORDER: process.env.ORDER_SERVICE_URL || "http://127.0.0.1:3003",
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || "http://127.0.0.1:3004",
  REVIEW: process.env.REVIEW_SERVICE_URL || "http://127.0.0.1:3005",
};

app.use(cors());
app.use(express.json({ limit: "6mb" }));

const routeTable = [
  { prefixes: ["/products", "/admin/products"], target: SERVICES.PRODUCT, service: "product-service" },
  { prefixes: ["/orders"], target: SERVICES.ORDER, service: "order-service" },
  { prefixes: ["/notifications"], target: SERVICES.NOTIFICATION, service: "notification-service" },
  { prefixes: ["/reviews", "/admin/reviews"], target: SERVICES.REVIEW, service: "review-service" },
  { prefixes: ["/users", "/register", "/login", "/logout", "/validate-token"], target: SERVICES.USER, service: "user-service" },
];

const jsonMessage = (res, status, message, extra = {}) =>
  res.status(status).json({ message, ...extra });

const shouldForwardBody = (method) => !["GET", "HEAD"].includes(method);

const forwardRequest = async (req, res, route) => {
  const targetUrl = new URL(req.originalUrl, `${route.target}/`);
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];

  if (shouldForwardBody(req.method)) {
    headers["content-type"] = headers["content-type"] || "application/json";
  }

  const init = {
    method: req.method,
    headers,
  };

  if (shouldForwardBody(req.method)) {
    init.body = JSON.stringify(req.body ?? {});
  }

  try {
    const upstream = await fetch(targetUrl, init);
    const payload = Buffer.from(await upstream.arrayBuffer());

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (["connection", "content-length", "transfer-encoding", "content-encoding"].includes(key.toLowerCase())) return;
      res.setHeader(key, value);
    });

    return res.send(payload);
  } catch (error) {
    console.error(`Gateway error for ${req.method} ${req.originalUrl}:`, error.message);
    return jsonMessage(
      res,
      503,
      `${route.service} is unavailable. Make sure the ShopLite backend services are running.`,
      { serviceUnavailable: true, service: route.service },
    );
  }
};

app.get("/health", (req, res) => {
  res.json({ service: "api-gateway", status: "UP", message: "API Gateway is running" });
});

app.get("/health/services", async (req, res) => {
  const entries = Object.entries(SERVICES);
  const results = await Promise.all(entries.map(async ([name, baseUrl]) => {
    try {
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json().catch(() => ({}));
      return { name, url: baseUrl, status: response.ok ? "UP" : "DOWN", response: data };
    } catch (error) {
      return { name, url: baseUrl, status: "DOWN", message: error.message };
    }
  }));
  const allUp = results.every((item) => item.status === "UP");
  res.status(allUp ? 200 : 503).json({ gateway: "UP", services: results });
});

app.use(async (req, res, next) => {
  const route = routeTable.find(({ prefixes }) =>
    prefixes.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`)),
  );

  if (!route) return next();
  return forwardRequest(req, res, route);
});

app.use((req, res) => {
  jsonMessage(res, 404, `No API route found for ${req.method} ${req.path}`);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
  console.log("Service health: http://localhost:8080/health/services");
});
