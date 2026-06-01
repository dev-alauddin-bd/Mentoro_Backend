import dotenv from "dotenv";
import { Response } from "express";

dotenv.config();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production"
    ? ("none" as const)
    : ("lax" as const),
  path: "/",
};

export const setRefreshTokenCookie = (
  res: Response,
  refreshToken: string
) => {
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearRefreshTokenCookie = (res: Response) => {

  res.clearCookie("refreshToken", cookieOptions);

  // Extra safety
  res.cookie("refreshToken", "", {
    ...cookieOptions,
    expires: new Date(0),
  });
};