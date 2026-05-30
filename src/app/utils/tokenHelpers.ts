import jwt from 'jsonwebtoken';
import env from '../config';
import { CustomAppError } from '../errors/customError';

/**
 * Verify an access token using the access secret.
 * Throws CustomAppError with status 401 on failure.
 */
export const verifyAccessToken = (token: string) => {
  if (!token) {
    throw new CustomAppError(401, 'No access token provided');
  }
  try {
    // env.jwt.secret is the access secret (short‑lived)
    return jwt.verify(token, env.jwt.secret as string) as { id: string };
  } catch (err) {
    throw new CustomAppError(401, 'Invalid or expired access token');
  }
};

/**
 * Verify a refresh token using the refresh secret.
 */
export const verifyRefreshToken = (token: string) => {
  if (!token) {
    throw new CustomAppError(401, 'No refresh token provided');
  }
  try {
    const secret = env.jwt.refreshSecret || env.jwt.secret;
    return jwt.verify(token, secret) as { id: string };
  } catch (err) {
    throw new CustomAppError(401, 'Invalid or expired refresh token');
  }
};

/**
 * Decode a token without verification – useful for inspection only.
 */
export const decodeToken = (token: string) => {
  try {
    return jwt.decode(token) as Record<string, any> | null;
  } catch {
    return null;
  }
};
