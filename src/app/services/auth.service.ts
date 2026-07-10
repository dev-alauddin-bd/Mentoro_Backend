import logger from "../../lib/logger";
import { CustomAppError } from "../errors/customError";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUser, IUserLogin } from "../interfaces/user.interface";
import { prisma } from "../../lib/prisma";
import { Role, UserStatus } from "@prisma/client";
import env from "../config";
import { generateTokens } from "../utils/generateTokens";

/* ================= REGISTER ================= */
const register = async (payload: IUser) => {
  logger.info("Signup:", payload.email);

  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new CustomAppError(400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    env.bcrypt.saltRounds
  );


  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: (payload.role as Role) || Role.student,
    },
  });

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const { password, ...safeUser } = user;

  return {
    user: safeUser,
    ...tokens,
  };
};

/* ================= LOGIN ================= */
const login = async (payload: IUserLogin) => {
  
  if (!payload.email || !payload.password) {
    throw new CustomAppError(400, "Email and password required");
  }

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new CustomAppError(404, "User not found");
  }

  const isMatch = await bcrypt.compare(payload.password, user.password);

  if (!isMatch) {
    throw new CustomAppError(401, "Invalid credentials");
  }

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const { password, ...safeUser } = user;

  return {
    user: safeUser,
    ...tokens,
  };
};

/* ================= REFRESH TOKEN ================= */
const refreshToken = async (token: string) => {
  if (!token) {
    throw new CustomAppError(401, "No token provided");
  }

  let decoded: any;

  try {
    decoded = jwt.verify(token, env.jwt.refreshSecret!);
  } catch {
    throw new CustomAppError(401, "Invalid or expired token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user || user.status === UserStatus.blocked) {
    throw new CustomAppError(403, "User not valid");
  }

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const { password, ...safeUser } = user;

  return {
    user: safeUser,
    ...tokens,
  };
};

/* ================= VERIFY SESSION ================= */
const verifySession = async (token: string) => {
  if (!token) {
    throw new CustomAppError(401, "No token");
  }

  let decoded: any;

  try {
    decoded = jwt.verify(token, env.jwt.refreshSecret!);
  } catch {
    throw new CustomAppError(401, "Invalid or expired token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user || user.status === UserStatus.blocked) {
    throw new CustomAppError(403, "User not valid");
  }

  const { password, ...safeUser } = user;

  return safeUser;
};

/* ================= EXPORT ================= */
export const authServices = {
  register,
  login,
  refreshToken,
  verifySession,
};
