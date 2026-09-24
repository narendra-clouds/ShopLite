const express = require("express");

const app = express();

const PORT = 3001;

// Middleware
app.use(express.json());

// Temporary in-memory users
const users = [];

// Health check
app.get("/health", (req, res) => {
  res.json({
    service: "user-service",
    status: "UP",
    message: "User Service is running"
  });
});

// Get users
app.get("/users", (req, res) => {
  res.json({
    users
  });
});

// Register user
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required"
    });
  }

  // Check if user already exists
  const existingUser = users.find(
    (user) => user.email === email
  );

  if (existingUser) {
    return res.status(409).json({
      message: "User already exists"
    });
  }

  // Create user
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password
  };

  users.push(newUser);

  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    }
  });
});


// Login user
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  // Find user
  const user = users.find(
    (user) => user.email === email
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password"
    });
  }

  // Check password
  if (user.password !== password) {
    return res.status(401).json({
      message: "Invalid email or password"
    });
  }

  // Login successful
  res.json({
    message: "Login successful",
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(
    `User Service running on http://localhost:${PORT}`
  );
});