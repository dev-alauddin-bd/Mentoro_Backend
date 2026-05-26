import { Request, Response } from "express";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";
import { dashboardService } from "../services/dashboard.service";
import { IUser } from "../interfaces/user.interface";

export const dashboardController = {
  // ================= ADMIN =================
  getAdminAnalytics: catchAsyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.getAdminAnalytics();
    sendResponse(res, 200, "Admin analytics retrieved", data);
  }),

  // ================= INSTRUCTOR =================
  getInstructorAnalytics: catchAsyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const data = await dashboardService.getInstructorAnalytics(user.id);
    sendResponse(res, 200, "Instructor analytics retrieved", data);
  }),

  // ================= STUDENT =================
  getStudentAnalytics: catchAsyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const data = await dashboardService.getStudentAnalytics(user.id);
    sendResponse(res, 200, "Student analytics retrieved", data);
  }),
};