//  ====================
//     Course Controller
// ====================

import { Request, RequestHandler, Response } from "express";
import { courseService } from "../services/course.service";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";
import logger from "../../lib/logger";

// ============================== CREATE Course ==============================

const createCourse = catchAsyncHandler(async (req: Request, res: Response) => {
  console.log("Received course creation request with data:", req.body);
  logger.info("Received course creation request with data:", req.body);
  const instructorId = req.user!.id;
  console.log("Instructor ID from auth middleware:", instructorId);
  const course = await courseService.createCourse({ ...req.body, instructorId });
  
  sendResponse(res, 201, "Course created successfully", course);
});

// ============================== GET ALL Courses ==============================
const getAllCourses = catchAsyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, category, sort, instructorId } = req.query;

  const courses = await courseService.getAllCourses({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    search: search?.toString(),
    category: category?.toString(),
    sort: sort?.toString(),
    instructorId: instructorId?.toString(),
    isFeatured: req.query.isFeatured?.toString(),
  });
  
  logger.debug("Fetched courses with query:", { query: req.query, count: Array.isArray(courses) ? courses.length : "N/A" });
  sendResponse(res, 200, "Courses fetched successfully", courses);
});

// ============================== GET Course By ID ==============================
const getCourseById = catchAsyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const course = await courseService.getCourseById(req.params.id as string, userId);
  sendResponse(res, 200, "Course fetched successfully", course);
});

// ============================== MARK Lesson Completed ==============================
const completeLesson = catchAsyncHandler(async (req: Request, res: Response) => {
  const { courseId, lessonId } = req.body;
  const userId = req.user!.id;

  await courseService.completeLesson(userId, courseId, lessonId);
  sendResponse(res, 200, "Progress tracked: Lesson marked as completed");
});


// ============================== UPDATE Course ==============================
const updateCourse = catchAsyncHandler(async (req: Request, res: Response) => {
  const course = await courseService.updateCourse(req.params.id as string, req.body);
  sendResponse(res, 200, "Course updated successfully", course);
});

// ============================== DELETE Course ==============================
const deleteCourse = catchAsyncHandler(async (req: Request, res: Response) => {
  const result = await courseService.deleteCourse(req.params.id as string);
  sendResponse(res, 200, result.message);
});

// ============================== TOGGLE Publish Status ==============================
const togglePublish = catchAsyncHandler(async (req: Request, res: Response) => {
  const course = await courseService.togglePublish(req.params.id as string);
  sendResponse(res, 200, "Course visibility updated", course);
});

// ============================== GET My Courses ==============================
const getMyCourses = catchAsyncHandler(async (req: Request, res: Response) => {
  const result = await courseService.getMyCourses(req.user!.id, req.query);
  sendResponse(res, 200, "Enrolled courses fetched successfully", result);
});



export const courseController: CourseController = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getMyCourses,
  completeLesson,
  togglePublish,

};

type CourseController = {
  createCourse: RequestHandler;
  getAllCourses: RequestHandler;
  getCourseById: RequestHandler;
  updateCourse: RequestHandler;
  deleteCourse: RequestHandler;
  getMyCourses: RequestHandler;
  completeLesson: RequestHandler;
  togglePublish: RequestHandler;

}
