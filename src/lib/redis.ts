import Redis from "ioredis";
import logger from "./logger";
import dotenv from "dotenv";
dotenv.config();

// Named export for better import control across the codebase
export const redisClient = new Redis(process.env.REDIS_URL);
redisClient.on("connect", () => {
  logger.info("🚀 Redis connected successfully");
});

redisClient.on("error", (err) => {
  logger.error("❌ Redis connection error:", err);
});

// Keep a default export for backward compatibility if any legacy module still expects it
export default redisClient;
