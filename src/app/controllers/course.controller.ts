import { Request, Response } from "express";
import { courseService } from "../services/course.service";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";

export const courseController = {
  // ================= CREATE COURSE =================
  createCourse: catchAsyncHandler(async (req: Request, res: Response) => {
    const instructorId = req.user!.id;
    const thumbnail = req.file?.path;
    const course = await courseService.createCourse({
      ...req.body,
      thumbnail,
      instructorId
    });
    sendResponse(res, 201, "Course created successfully", course);
  }),

  // ================= GET ALL PUBLIC COURSES =================
  getAllPublicCourses: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await courseService.getAllPublicCourses(req.query);

    sendResponse(res, 200, "Courses fetched successfully", result);
  }),

  // ================= GET ALL COURSES =================
  getInstructorCourses: catchAsyncHandler(async (req: Request, res: Response) => {
    const instructorId = req.user!.id;
    const result = await courseService.getAllInstructorCourses(instructorId, req.query);
    sendResponse(res, 200, "Courses fetched successfully", result);
  }),

  // ================= GET COURSE BY ID =================
  getCourseById: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await courseService.getCourseById(
      req.params.id as string
    );
    sendResponse(res, 200, "Course fetched successfully", result);
  }),

  // ================= MY COURSES =================
  getMyCourses: catchAsyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const result = await courseService.getMyCourses(
      studentId,
      req.query
    );
    sendResponse(res, 200, "My courses fetched successfully", result);
  }),

  // ================= COMPLETE LESSON =================
  completeLesson: catchAsyncHandler(async (req: Request, res: Response) => {
    const { courseId, lessonId } = req.body;
    const studentId = req.user!.id;
    await courseService.completeLesson(
      studentId,
      courseId,
      lessonId
    );
    sendResponse(res, 200, "Lesson completed successfully");
  }),

  // ================= UPDATE COURSE =================
  updateCourse: catchAsyncHandler(async (req: Request, res: Response) => {
    const thumbnail = req.file?.path;
    const body = {
      ...req.body,
      thumbnail
    }
    const result = await courseService.updateCourse(
      req.params.id as string,
      body
    );
    sendResponse(res, 200, "Course updated successfully", result);
  }),

  // ================= DELETE COURSE =================
  deleteCourse: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await courseService.deleteCourse(
      req.params.id as string,
      req.user
    );
    sendResponse(res, 200, result.message);
  }),

  // ================= TOGGLE PUBLISH =================
  togglePublish: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await courseService.togglePublish(req.params.id as string);
    sendResponse(res, 200, "Course publish status updated", result);
  }),
};