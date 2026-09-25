const express = require("express");

const app = express();
const PORT = 3002;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://127.0.0.1:3001";
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || "shoplite-internal-dev-key";

app.use(express.json({ limit: "6mb" }));

const readJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { return { message: text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || `HTTP ${response.status}` }; }
};

let products = [
  {
    id: 1,
    name: "Laptop",
    price: 55000,
    category: "Electronics",
    description: "A practical laptop for study, development and everyday work.",
    stock: 12,
    image: "",
    status: "ACTIVE",
  },
  {
    id: 2,
    name: "Wireless Mouse",
    price: 1200,
    category: "Accessories",
    description: "A comfortable wireless mouse for work and everyday browsing.",
    stock: 25,
    image: "",
    status: "ACTIVE",
  },
  {
    id: 3,
    name: "Mechanical Keyboard",
    price: 3500,
    category: "Accessories",
    description: "A responsive mechanical keyboard designed for productive typing.",
    stock: 18,
    image: "",
    status: "ACTIVE",
  },
];

const validateAdmin = async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const response = await fetch(`${USER_SERVICE_URL}/validate-token`, {
      headers: { Authorization: authorization },
    });
    if (!response.ok) return res.status(401).json({ message: "Invalid authentication" });
    const data = await readJsonResponse(response);
    if (!data.user?.id) return res.status(401).json({ message: data.message || "Invalid authentication response" });
    if (data.user.role !== "ADMIN") return res.status(403).json({ message: "Admin access required" });
    req.admin = data.user;
    next();
  } catch (error) {
    console.error("User Service validation failed:", error.message);
    return res.status(503).json({ message: "Authentication service unavailable" });
  }
};

app.get("/health", (req, res) => {
  res.json({ service: "product-service", status: "UP", message: "Product Service is running" });
});

app.get("/products", (req, res) => {
  const activeProducts = products.filter((product) => product.status !== "INACTIVE");
  res.json({ products: activeProducts });
});

app.get("/products/:id", (req, res) => {
  const product = products.find((item) => String(item.id) === String(req.params.id) && item.status !== "INACTIVE");
  if (!product) return res.status(404).json({ message: "Product not found" });
  return res.json({ product });
});

app.get("/admin/products", validateAdmin, (req, res) => {
  res.json({ products });
});

app.post("/admin/products", validateAdmin, (req, res) => {
  const { name, price, category, description = "", stock = 0, image = "" } = req.body;
  if (!name || !category || !Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
    return res.status(400).json({ message: "Name, category, valid price and non-negative integer stock are required" });
  }

  const product = {
    id: products.length ? Math.max(...products.map((item) => item.id)) + 1 : 1,
    name: String(name).trim(),
    price: Number(price),
    category: String(category).trim(),
    description: String(description).trim(),
    stock: Number(stock),
    image: String(image || "").trim(),
    status: "ACTIVE",
  };
  products.push(product);
  res.status(201).json({ message: "Product created successfully", product });
});

app.put("/admin/products/:id", validateAdmin, (req, res) => {
  const product = products.find((item) => String(item.id) === String(req.params.id));
  if (!product) return res.status(404).json({ message: "Product not found" });

  const { name, price, category, description, stock, image, status } = req.body;
  if (name !== undefined) product.name = String(name).trim();
  if (category !== undefined) product.category = String(category).trim();
  if (description !== undefined) product.description = String(description).trim();
  if (image !== undefined) product.image = String(image).trim();
  if (price !== undefined) {
    if (!Number.isFinite(Number(price)) || Number(price) < 0) return res.status(400).json({ message: "Price must be a non-negative number" });
    product.price = Number(price);
  }
  if (stock !== undefined) {
    if (!Number.isInteger(Number(stock)) || Number(stock) < 0) return res.status(400).json({ message: "Stock must be a non-negative integer" });
    product.stock = Number(stock);
  }
  if (status !== undefined) {
    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ message: "Status must be ACTIVE or INACTIVE" });
    }
    product.status = status;
  }

  res.json({ message: "Product updated successfully", product });
});

app.patch("/admin/products/:id/status", validateAdmin, (req, res) => {
  const product = products.find((item) => String(item.id) === String(req.params.id));
  if (!product) return res.status(404).json({ message: "Product not found" });
  const { status } = req.body;
  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    return res.status(400).json({ message: "Status must be ACTIVE or INACTIVE" });
  }
  product.status = status;
  return res.json({
    message: status === "ACTIVE" ? "Product activated successfully" : "Product deactivated successfully",
    product,
  });
});

app.delete("/admin/products/:id", validateAdmin, (req, res) => {
  const product = products.find((item) => String(item.id) === String(req.params.id));
  if (!product) return res.status(404).json({ message: "Product not found" });
  product.status = "INACTIVE";
  res.json({ message: "Product deactivated successfully", product });
});

app.patch("/products/:id/stock", (req, res) => {
  if (req.headers["x-shoplite-internal-key"] !== INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Internal service access required" });
  }
  const product = products.find((item) => String(item.id) === String(req.params.id));
  if (!product) return res.status(404).json({ message: "Product not found" });

  const { quantity, operation = "DECREASE" } = req.body;
  if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
    return res.status(400).json({ message: "quantity must be a positive integer" });
  }
  if (operation === "INCREASE") {
    product.stock += Number(quantity);
    return res.json({ message: "Stock restored", product });
  }

  if (product.status === "INACTIVE") {
    return res.status(409).json({ message: "Inactive products cannot reserve stock" });
  }

  if (Number(quantity) > product.stock) {
    return res.status(409).json({ message: `Insufficient stock. Only ${product.stock} available.` });
  }

  product.stock -= Number(quantity);
  return res.json({ message: "Stock updated", product });
});

app.listen(PORT, () => {
  console.log(`Product Service running on http://localhost:${PORT}`);
});
