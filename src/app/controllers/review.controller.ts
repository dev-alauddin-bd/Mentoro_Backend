import { Request, RequestHandler, Response } from "express";
import { reviewService } from "../services/review.service";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";

export const reviewController = {
  // ================= CREATE REVIEW =================
  createReview: catchAsyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const { content, rating, courseId } = req.body;

    const result = await reviewService.createReview({
      content,
      rating,
      courseId,
      studentId,
    });

    sendResponse(res, 201, "Review submitted successfully", result);
  }),

  // ================= GET ALL REVIEWS =================
  getAllReviews: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await reviewService.getAllReviews(req.query);

    sendResponse(res, 200, "Reviews fetched successfully", result);
  }),

  // ================= DELETE REVIEW =================
  deleteReview: catchAsyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const { id } = req.params;

    await reviewService.deleteReview(id as string, studentId);

    sendResponse(res, 200, "Review deleted successfully");
  }),
};