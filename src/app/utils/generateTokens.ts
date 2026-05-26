
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config()
// Token generation helper for authentication
export const generateTokens = (user: { id: string; email: string; role: string }) => {
  // Access Token: Short-lived token for session authentication
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "1d" }
  );

  // Refresh Token: Longer-lived token to regenerate access tokens
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};
