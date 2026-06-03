import { Request, Response } from "express";
import { courseService } from "../services/course.service";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";

export const courseController = {

  // ================== CREATE COURSE ==================
  createCourse: catchAsyncHandler(async (req: Request, res: Response) => {
    const instructorId = req.user!.id;
    const thumbnail = req.file?.path;

    const result = await courseService.createCourse({
      ...req.body,
      instructorId,
      thumbnail,
    });

    sendResponse(res, 201, "Successfully created course", result);
  }),

  // ================== GET ALL PUBLIC COURSES ==================
  getAllPublicCourses: catchAsyncHandler(async (req, res) => {
    
    const { data, meta } = await courseService.getAllPublicCourses(req.query as any);
    sendResponse(res, 200, "Successfully fetched all public courses", data, meta);
  }),


  // ======================== GET ALL INSTRUCTOR COURSES ========================
  getAllInstructorCourses: catchAsyncHandler(async (req, res) => {
    const instructorId = req.user!.id;
    const {data,meta} = await courseService.getAllInstructorCourses(instructorId, req.query as any);
    sendResponse(res, 200, "Successfully fetched all instructor courses", data,meta);
  }),

  // ================== GET SINGLE COURSE BY SLUG ==================
  getCourseBySlug: catchAsyncHandler(async (req, res) => {
    const result = await courseService.getCourseBySlug(req.params.slug as string);
    sendResponse(res, 200, "Successfully fetched course by slug", result);
  }),

  // ================== GET STUDENT ENROLLED COURSES ==================
  getStudentEnrolledCourses: catchAsyncHandler(async (req, res) => {
    const studentId = req.user!.id;
    const result = await courseService.getStudentEnrolledCourses(studentId);
    sendResponse(res, 200, "Successfully fetched student enrolled courses", result);
  }),

  // ================== GET STUDENT ENROLLED COURSE MODULES ==================
  getStudentEnrolledCourseModules: catchAsyncHandler(async (req, res) => {
    console.log("req.params", req.params);
    const studentId = req.user!.id;
    const result = await courseService.getStudentEnrolledCourseModules(studentId, req.params.courseId as string);
    sendResponse(res, 200, "Successfully fetched student enrolled course modules", result);
  }),

  // ================== COMPLETE LESSON ==================
  completeLesson: catchAsyncHandler(async (req, res) => {
    await courseService.completeLesson(
      req.user!.id,
      req.body.courseId,
      req.body.lessonId
    );
    sendResponse(res, 200, "Successfully completed lesson");
  }),

  // ================== UPDATE COURSE ==================
  updateCourse: catchAsyncHandler(async (req, res) => {
    const result = await courseService.updateCourse(req.params.id as string, req.body);
    sendResponse(res, 200, "Successfully updated course", result);
  }),

  // ================== DELETE COURSE ==================

  deleteCourse: catchAsyncHandler(async (req, res) => {
    const result = await courseService.deleteCourse(req.params.id as string);
    sendResponse(res, 200, "Successfully deleted course", result);
  }),

  // ================== TOGGLE PUBLISH ==================
  togglePublish: catchAsyncHandler(async (req, res) => {
    const result = await courseService.togglePublish(req.params.id as string);
    sendResponse(res, 200, "Successfully toggled publish", result);
  }),
};