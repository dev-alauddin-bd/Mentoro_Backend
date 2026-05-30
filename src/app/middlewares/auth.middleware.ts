import dotenv from "dotenv";

dotenv.config();

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { IUser } from "../interfaces/user.interface";
import { verifyAccessToken } from "../utils/tokenHelpers";

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * authentication routes – requires valid JWT.
 */
export const authentication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ status: "fail", message: "Access denied: No authentication token provided" });
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res
        .status(401)
        .json({ status: "fail", message: "Authentication failed: User no longer exists" });
    }
    const { password: _password, ...safeUser } = user;
    req.user = safeUser as IUser;
    next();
  } catch {
    return res
      .status(401)
      .json({ status: "fail", message: "Authentication failed: Invalid or expired token" });
  }
};

/**
 * Role‑based access control.
 */
export const authorization = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ status: "fail", message: "Access denied: User authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: `Permission denied: Your role (${req.user.role}) is not authorizationd for this resource`,
      });
    }

    next();
  };
};
