const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = 3001;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@shoplite.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

app.use(express.json());

const users = [
  {
    id: 1,
    name: "ShopLite Owner",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
];

const sessions = new Map();

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
});

const getToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
};

const authenticate = (req, res, next) => {
  const token = getToken(req);
  const session = sessions.get(token);
  if (!session) return res.status(401).json({ message: "Authentication required" });
  const user = users.find((item) => item.id === session.userId);
  if (!user) return res.status(401).json({ message: "Invalid session" });
  req.user = user;
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

app.get("/health", (req, res) => {
  res.json({ service: "user-service", status: "UP", message: "User Service is running" });
});

app.get("/validate-token", authenticate, (req, res) => {
  res.json({ valid: true, user: safeUser(req.user) });
});

app.get("/users", authenticate, requireAdmin, (req, res) => {
  res.json({ users: users.map(safeUser) });
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (users.some((user) => user.email === normalizedEmail)) {
    return res.status(409).json({ message: "User already exists" });
  }

  const newUser = {
    id: users.length + 1,
    name: String(name).trim(),
    email: normalizedEmail,
    password,
    role: "USER",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  res.status(201).json({ message: "User registered successfully", user: safeUser(newUser) });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = users.find((item) => item.email === String(email).trim().toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (user.status !== "ACTIVE") {
    return res.status(403).json({ message: "This account is inactive" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { userId: user.id, createdAt: Date.now() });

  res.json({ message: "Login successful", token, user: safeUser(user) });
});

app.post("/logout", authenticate, (req, res) => {
  const token = getToken(req);
  sessions.delete(token);
  res.json({ message: "Logged out successfully" });
});

app.listen(PORT, () => {
  console.log(`User Service running on http://localhost:${PORT}`);
  console.log(`Admin login: ${ADMIN_EMAIL}`);
});
