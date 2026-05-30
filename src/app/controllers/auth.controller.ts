//  ====================
//     Auth Controller
// ====================

import { Request, Response } from "express";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { authServices } from "../services/auth.service";
import { IUser, IUserLogin } from "../interfaces/user.interface";
import { setRefreshTokenCookie, clearRefreshTokenCookie } from "../utils/cookie";
import { sendResponse } from "../utils/sendResponse";

export const authControllers = {

  // ============================== REGISTER ==============================
  register: catchAsyncHandler(async (req: Request, res: Response) => {
    const { accessToken, refreshToken, user } = await authServices.register(req.body as IUser);
    setRefreshTokenCookie(res, refreshToken);
    sendResponse(res, 201, "User registered successfully", { user, accessToken });
  }),

  // ============================== LOGIN ==============================
  login: catchAsyncHandler(async (req: Request, res: Response) => {
    const { accessToken, refreshToken, user } = await authServices.login(req.body as IUserLogin);
    setRefreshTokenCookie(res, refreshToken);
    sendResponse(res, 200, "User logged in successfully", { accessToken, user });
  }),

  // ============================== REFRESH Token ==============================
  refreshToken: catchAsyncHandler(async (req: Request, res: Response) => {
    try {
      const token = req.cookies.refreshToken;
      const { accessToken, refreshToken: newRefresh, user } = await authServices.refreshToken(token);
      setRefreshTokenCookie(res, newRefresh);
      sendResponse(res, 200, "Access token refreshed", { accessToken, user });
    } catch (err: any) {
      // err is a CustomAppError instance; sendResponse formats it consistently
      sendResponse(res, err.statusCode ?? 500, err.message);
    }
  }),

  // ============================== LOGOUT ==============================
  logout: catchAsyncHandler(async (req: Request, res: Response) => {
    clearRefreshTokenCookie(res);
    sendResponse(res, 200, "Logged out successfully");
  }),


  // ============================== VERIFY Session ==============================
  verifySession: catchAsyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;
    const user = await authServices.verifySession(token);
    sendResponse(res, 200, "Session verified", user);
  }),



}




