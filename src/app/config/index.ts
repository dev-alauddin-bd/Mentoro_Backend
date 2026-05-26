import dotenv from "dotenv";

dotenv.config();

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  frontendUrl: process.env.FRONTEND_URL,
  backendUrl: process.env.BACKEND_URL,

  databaseUrl: process.env.DATABASE_URL,

  jwt: {
    secret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_ACCESS_SECRET_EXPIRES_IN || "1d",
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  },

  bcrypt: {
    saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  redis: {
    url: process.env.REDIS_URL,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  google: {
    apiKey: process.env.GOOGLE_API_KEY,
  },

  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
  },
};

export default env;