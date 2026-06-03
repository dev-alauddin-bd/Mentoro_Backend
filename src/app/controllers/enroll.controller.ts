import { Request, Response } from "express";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";
import { enrollService } from "../services/enroll.service";

export const enrollController = {
  // ================= ENROLL COURSE =================
  enrollCourse: catchAsyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const { courseId } = req.body;

    const result = await enrollService.enrollCourse(studentId, courseId);

    sendResponse(res, 201, "Enrollment processed", result);
  }),

  // ================= GET MY ENROLLMENTS =================
  getMyEnrollments: catchAsyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;

    const { data, meta } = await enrollService.getMyEnrollments(
      studentId,
      req.query
    );

    sendResponse(res, 200, "Enrollments fetched", data, meta);
  }),

  // ================= CANCEL ENROLLMENT =================
  cancelEnrollment: catchAsyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const { courseId } = req.body;

    const result = await enrollService.cancelEnrollment(
      studentId,
      courseId
    );

    sendResponse(res, 200, "Enrollment cancelled", result);
  }),
};