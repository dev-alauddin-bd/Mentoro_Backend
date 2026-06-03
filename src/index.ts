import express, { Application, Request, Response } from "express";
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
// TRUST PROXY (for reverse proxy / cloud)
// ==============================
app.set("trust proxy", 1);

// ==============================
// SECURITY HEADERS (Helmet - optimized)
// ==============================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ==============================
// CORS (production safe + fast)
// ==============================
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [env.frontendUrl];

      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS Not Allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

// ==============================
// BODY PARSER (IMPORTANT for performance)
// ==============================
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ==============================
// STATIC FILES
// ==============================
app.use(
  "/public",
  express.static(path.join(process.cwd(), "src", "app", "public"), {
    maxAge: "1d", // caching boost
  })
);

// ==============================
// GLOBAL RATE LIMIT (OPTIMIZED)
// ==============================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === "production" ? 200 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// ==============================
// AUTH RATE LIMIT (STRICT)
// ==============================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === "production" ? 50 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);

// ==============================
// WEBHOOK (BEFORE SANITIZATION)
// ==============================
app.use("/webhook", webhookRouter);

// ==============================
// SANITIZATION (XSS / INJECTION protection)
// ==============================
app.use(sanitizeRequest);

// ==============================
// HEALTH CHECK (FAST RESPONSE)
// ==============================
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server healthy 🚀",
    uptime: process.uptime(),
    memory: process.memoryUsage().rss,
  });
});

// ==============================
// API ROUTES
// ==============================
app.use("/api", baseRouter);

// ==============================
// ROOT ROUTE
// ==============================
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Mentoro API v3 🚀",
  });
});

// ==============================
// 404 HANDLER
// ==============================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// ==============================
// GLOBAL ERROR HANDLER
// ==============================
app.use(globalErrorHandler);

export default app;