//  ====================
//    Lesson Controller
// ====================

import { Request,  Response } from "express";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { lessonService } from "../services/lesson.service";
import { sendResponse } from "../utils/sendResponse";
import logger from "../../lib/logger";

export const lessonController = {

  // ============================== ADD Lesson ==============================
  addLesson: catchAsyncHandler(async (req: Request, res: Response) => {
    logger.info("Received request to add lesson with body:", req.body);
    // req.body already validated by validate(createLessonValidation) middleware
    const lesson = await lessonService.addLesson(req.body);
    sendResponse(res, 201, "Lesson added successfully", lesson);
  }),

  // ============================== UPDATE Lesson ==============================
  updateLesson: catchAsyncHandler(async (req: Request, res: Response) => {
    const { lessonId } = req.params;
    // req.body already validated by validate(updateLessonValidation) middleware
    const lesson = await lessonService.updateLesson(lessonId as string, req.body);
    sendResponse(res, 200, "Lesson updated successfully", lesson);
  }),

  // ============================== DELETE Lesson ==============================
  deleteLesson: catchAsyncHandler(async (req: Request, res: Response) => {
    const { lessonId } = req.params;
    await lessonService.deleteLesson(lessonId as string);
    sendResponse(res, 200, "Lesson deleted successfully");
  }),

  // ============================== GET Lesson By ID ==============================
  getLessonById: catchAsyncHandler(async (req: Request, res: Response) => {
    const { lessonId } = req.params;
    const lesson = await lessonService.getLessonById(lessonId as string);
    sendResponse(res, 200, "Lesson fetched successfully", lesson);
  }),

  // ============================== GET ALL Lessons ==============================
  getAllLessons: catchAsyncHandler(async (req: Request, res: Response) => {
    const { moduleId } = req.query;
    const lessons = await lessonService.getAllLessons(moduleId as string);
    sendResponse(res, 200, "Lessons fetched successfully", lessons);
  })

}
