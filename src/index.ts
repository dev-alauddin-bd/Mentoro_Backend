import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";

import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import { sanitizeRequest } from "./app/middlewares/sanitize.middleware";
import { baseRouter } from "./app/routes/baseRouter";
import { webhookRouter } from "./app/routes/webhook.route";
import env from "./app/config";

const app: Application = express();

// ==============================
// TRUST PROXY
// ==============================
app.set("trust proxy", 1);

// ==============================
// STATIC FILES
// ==============================
app.use(
  "/public",
  express.static(path.join(process.cwd(), "src", "app", "public"))
);

// ==============================
// SECURITY (Helmet)
// ==============================
app.use(
  helmet({
    contentSecurityPolicy: false, // optional: production debug friendly
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ==============================
// CORS (IMPORTANT)
// ==============================
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

// ==============================
// BASIC MIDDLEWARES
// ==============================
app.use(cookieParser());
app.use(express.json());

// ==============================
// RATE LIMIT (GLOBAL)
// ==============================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many requests. Try later.",
  },
});

app.use(limiter);

// ==============================
// AUTH RATE LIMIT
// ==============================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skipSuccessfulRequests: true,
});

app.use("/api/auth", authLimiter);

// ==============================
// WEBHOOK (before sanitization)
// ==============================
app.use("/webhook", webhookRouter);

// ==============================
// SANITIZATION
// ==============================
app.use(sanitizeRequest);

// ==============================
// HEALTH CHECK
// ==============================
app.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Server healthy 🚀",
    uptime: process.uptime(),
  });
});

// ==============================
// API ROUTES
// ==============================
app.use("/api", baseRouter);

// ==============================
// ROOT
// ==============================
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Mentoro API v3 🚀",
  });
});

// ==============================
// 404
// ==============================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ==============================
// GLOBAL ERROR HANDLER
// ==============================
app.use(globalErrorHandler);

export default app;