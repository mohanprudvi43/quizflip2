import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import domainRoutes from "./routes/domainRoutes.js";
import learnerRoutes from "./routes/learnerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { notFound, errorHandler } from "./middleware/error.js";

export const app = express();

const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || "50mb";

const splitCsvOrigins = (value = "") =>
  String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const allowedOrigins = [
  process.env.CLIENT_URL,
  ...splitCsvOrigins(process.env.CLIENT_URLS),
  "http://localhost:5173",
  "http://localhost:5174"
].filter(Boolean);

const isLocalDevOrigin = (origin = "") =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

const isPrivateLanOrigin = (origin = "") =>
  /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(
    origin
  );

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin/non-browser requests and known frontend origins.
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        isLocalDevOrigin(origin) ||
        isPrivateLanOrigin(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "quizflip2-backend" });
});

app.get("/", (_req, res) => {
  res.json({
    message: "Quizflip2 backend is running",
    health: "/api/health"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/learner", learnerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);

// Friendly fallback for non-API browser hits (e.g. /, /*, /anything)
app.get("*", (req, res) => {
  res.status(200).json({
    message: "Quizflip2 backend endpoint",
    requestedPath: req.originalUrl,
    docs: "Use /api/health and /api/* routes"
  });
});

app.use(notFound);
app.use(errorHandler);
