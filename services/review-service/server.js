const express = require("express");

const app = express();
const PORT = Number(process.env.PORT || 3005);
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://127.0.0.1:3001";

app.use(express.json({ limit: "1mb" }));

const reviews = [];

const readJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || `HTTP ${response.status}`,
    };
  }
};

const getToken = (req) => {
  const authorization = req.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
};

const authenticate = async (req, res, next) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    const response = await fetch(`${USER_SERVICE_URL}/validate-token`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await readJsonResponse(response);
    if (!response.ok) return res.status(response.status === 403 ? 403 : 401).json({ message: data.message || "Invalid authentication" });
    if (!data.user?.id) return res.status(401).json({ message: "Invalid authentication response" });

    req.user = data.user;
    next();
  } catch (error) {
    console.error("User Service validation failed:", error.message);
    return res.status(503).json({ message: "Authentication service unavailable" });
  }
};

app.get("/health", (req, res) => {
  res.json({ service: "review-service", status: "UP", message: "Review Service is running" });
});

app.get("/reviews/user", authenticate, (req, res) => {
  const userReviews = reviews.filter((review) => String(review.userId) === String(req.user.id));
  return res.json({ reviews: userReviews, count: userReviews.length });
});

app.get("/reviews/:productId", (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const items = reviews.filter((review) => review.productId === productId);
  const average = items.length
    ? Number((items.reduce((sum, review) => sum + review.rating, 0) / items.length).toFixed(1))
    : 0;

  return res.json({ reviews: items, average, count: items.length });
});

app.post("/reviews", authenticate, (req, res) => {
  const productId = Number(req.body.productId);
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || "").trim();

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "A valid product id is required" });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }
  if (comment.length < 3 || comment.length > 1000) {
    return res.status(400).json({ message: "Review must contain 3 to 1000 characters" });
  }

  if (reviews.some((review) => review.productId === productId && review.userId === req.user.id)) {
    return res.status(409).json({ message: "You have already reviewed this product" });
  }

  const review = {
    id: reviews.length ? Math.max(...reviews.map((item) => item.id)) + 1 : 1,
    productId,
    userId: req.user.id,
    userName: req.user.name,
    rating,
    comment,
    createdAt: new Date().toISOString(),
  };

  reviews.push(review);
  return res.status(201).json({ message: "Review added", review });
});

app.delete("/reviews/:id", authenticate, (req, res) => {
  const index = reviews.findIndex((review) => String(review.id) === String(req.params.id));
  if (index < 0) return res.status(404).json({ message: "Review not found" });

  const review = reviews[index];
  if (review.userId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied" });
  }

  reviews.splice(index, 1);
  return res.json({ message: "Review deleted" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Review Service running on http://localhost:${PORT}`);
});
