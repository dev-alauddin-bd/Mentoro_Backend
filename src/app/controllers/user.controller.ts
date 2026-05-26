//  ====================
//     User Controller (FIXED)
// ====================

import { Request, RequestHandler, Response } from "express";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";
import { userService } from "../services/user.service";
import { IUser } from "../interfaces/user.interface";
export const userController = {
  getAllUsers: catchAsyncHandler(async (req: Request, res: Response) => {
    const users = await userService.getAllUsers(req.user as IUser, req.query);
    sendResponse(res, 200, "Users retrieved successfully", users);
  }),

  updateUserRole: catchAsyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    const user = await userService.updateUserRole(id as string, role);
    sendResponse(res, 200, "User role updated successfully", user);
  }),

  updateUserStatus: catchAsyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const user = await userService.updateUserStatus(id as string, status);
    sendResponse(res, 200, "User status updated successfully", user);
  }),

  becomeInstructor: catchAsyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    await userService.becomeInstructor(user.id);
    sendResponse(res, 200, "Success: You are now an instructor!");
  }),

  updateProfile: catchAsyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const updatedUser = await userService.updateProfile(user.id, {
      name: req.body?.name,
      avatar: req.file?.path || undefined,
    });

    sendResponse(res, 200, "Profile updated successfully", updatedUser);
  }),
};