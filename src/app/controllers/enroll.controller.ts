//  ====================
//    Enroll Controller
// ====================

import { Request,  Response } from "express";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";
import { enrollService } from "../services/enroll.service";


export const enrollController = {
  // ============================== ENROLL In Course ==============================
  enrollCourse: catchAsyncHandler(async (req: Request, res: Response) => {
    // req.body already validated by validate(enrollValidation) middleware
    const { courseId } = req.body as { courseId: string };
    const studentId = req.user!.id;
    const enrollment = await enrollService.enrollCourse(studentId, courseId);
    console.log("enrollment", enrollment);

    sendResponse(res, 201, "Enrolled successfully", enrollment);
  }),

  // ============================== GET My Enrollments ==============================
  getMyEnrollments: catchAsyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const result = await enrollService.getMyEnrollments(studentId, req.query);
    sendResponse(res, 200, "Enrollments fetched successfully", result);
  }),

  // ============================== GET Enrolled Content ==============================
  getEnrolledCourseContent: catchAsyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const studentId = req.user!.id;
    const courseContent = await enrollService.getEnrolledCourseContent(studentId, courseId as string);
    sendResponse(res, 200, "Course content fetched successfully", courseContent);
  }),

  // ============================== CANCEL Enrollment / REFUND ==============================
  cancelEnrollment: catchAsyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.body as { courseId: string };
    const studentId = req.user!.id;
    const result = await enrollService.cancelEnrollment(studentId, courseId);
    sendResponse(res, 200, "Enrollment cancelled successfully", result);
  })
}
