const express = require("express");

const app = express();
const PORT = 3002;

app.use(express.json());

const products = [
  {
    id: 1,
    name: "Laptop",
    price: 55000,
    category: "Electronics",
    description: "A practical laptop for study, development and everyday work.",
    stock: 12,
    image: ""
  },
  {
    id: 2,
    name: "Wireless Mouse",
    price: 1200,
    category: "Accessories",
    description: "A comfortable wireless mouse for work and everyday browsing.",
    stock: 25,
    image: ""
  },
  {
    id: 3,
    name: "Mechanical Keyboard",
    price: 3500,
    category: "Accessories",
    description: "A responsive mechanical keyboard designed for productive typing.",
    stock: 18,
    image: ""
  }
];

app.get("/health", (req, res) => {
  res.json({
    service: "product-service",
    status: "UP",
    message: "Product Service is running"
  });
});

app.get("/products", (req, res) => {
  res.json({ products });
});

app.get("/products/:id", (req, res) => {
  const product = products.find((item) => String(item.id) === String(req.params.id));

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.json({ product });
});

app.listen(PORT, () => {
  console.log(`Product Service running on http://localhost:${PORT}`);
});
