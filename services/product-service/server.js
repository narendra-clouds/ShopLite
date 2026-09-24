const express = require("express");

const app = express();
const PORT = 3002;

app.use(express.json());

// Temporary in-memory products
const products = [
  {
    id: 1,
    name: "Laptop",
    price: 55000,
    category: "Electronics"
  },
  {
    id: 2,
    name: "Wireless Mouse",
    price: 1200,
    category: "Accessories"
  },
  {
    id: 3,
    name: "Mechanical Keyboard",
    price: 3500,
    category: "Accessories"
  }
];

// Health check
app.get("/health", (req, res) => {
  res.json({
    service: "product-service",
    status: "UP",
    message: "Product Service is running"
  });
});

// Get all products
app.get("/products", (req, res) => {
  res.json({
    products
  });
});

// Get single product
app.get("/products/:id", (req, res) => {
  const id = Number(req.params.id);

  const product = products.find(product => product.id === id);

  if (!product) {
    return res.status(404).json({
      message: "Product not found"
    });
  }

  res.json({
    product
  });
});

// Add product
app.post("/products", (req, res) => {
  const { name, price, category } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({
      message: "Name, price and category are required"
    });
  }

  const newProduct = {
    id: products.length + 1,
    name,
    price,
    category
  };

  products.push(newProduct);

  res.status(201).json({
    message: "Product added successfully",
    product: newProduct
  });
});

// Delete product
app.delete("/products/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = products.findIndex(product => product.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Product not found"
    });
  }

  const deletedProduct = products.splice(index, 1);

  res.json({
    message: "Product deleted successfully",
    product: deletedProduct[0]
  });
});

app.listen(PORT, () => {
  console.log(`Product Service running on http://localhost:${PORT}`);
});