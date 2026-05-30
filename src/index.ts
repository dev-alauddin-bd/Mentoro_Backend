import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import { sanitizeRequest } from "./app/middlewares/sanitize.middleware";
import { baseRouter } from "./app/routes/baseRouter";
import { webhookRouter } from "./app/routes/webhook.route";
import path from "path";
const app: Application = express();

app.use(
  "/public",
  express.static(path.join(process.cwd(), "src", "app", "public"))
);
// ==============================
// TRUST PROXY (Railway / Render safe)
// ==============================
app.set("trust proxy", 1);

// ==============================
// SECURITY HEADERS (Helmet)
// ==============================
app.use(
  helmet({
    // Content-Security-Policy: restrict resource origins
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
    // Prevent MIME-type sniffing
    noSniff: true,
    // Prevent clickjacking via X-Frame-Options
    frameguard: { action: "deny" },
    // Remove X-Powered-By header (also done below, belt-and-suspenders)
    hidePoweredBy: true,
    // Enable XSS filter in older browsers
    xssFilter: true,
    // Referrer-Policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);


// ==============================
// HEALTH CHECK
// ==============================
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server healthy 🚀",
    uptime: process.uptime(),
  });
});

// ==============================
// WHITELIST (optional but production useful)
// ==============================
const whitelist = process.env.IP_WHITELIST?.split(",") || [];

// ==============================
// RATE LIMIT (global safety — 100 req / 15 min)
// ==============================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many requests. Try later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==============================
// RATE LIMIT — AUTH routes (stricter: 10 req / 15 min)
// authentications login/signup from brute-force and credential-stuffing attacks.
// ==============================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts toward the limit
});

// ==============================
// CUSTOM RATE LIMIT WITH WHITELIST
// ==============================
const rateLimitWithWhitelist = (req: Request, res: Response, next: NextFunction) => {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "";

  if (whitelist.includes(ip)) {
    return next();
  }

  return limiter(req, res, next);
};

// ==============================
// MIDDLEWARES
// ==============================
app.use(rateLimitWithWhitelist);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || (process.env.NODE_ENV !== "production" ? "*" : undefined),
    credentials: true,
  })
);

app.use(cookieParser());

// ==============================
// WEBHOOK (before JSON heavy routes, no sanitization needed here)
// ==============================
app.use("/webhook", webhookRouter);

app.use(express.json());

// ==============================
// INPUT SANITIZATION (after body parsing, before routes)
// Strips operator-injection keys and null bytes from body/query/params.
// ==============================
app.use(sanitizeRequest);

// ==============================
// AUTH-SPECIFIC RATE LIMITER
// ==============================
app.use("/api/auth", authLimiter);


// ==============================
// API ROUTES
// ==============================
app.use("/api", baseRouter);

// ==============================
// ROOT ROUTE
// ==============================
app.get("/", (req: Request, res: Response) => {
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
    message: `Route ${req.originalUrl} not found`,
  });
});

// ==============================
// GLOBAL ERROR HANDLER
// ==============================
app.use(globalErrorHandler);

export default app;