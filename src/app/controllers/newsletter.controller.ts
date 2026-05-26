//  ====================
//     Newsletter Controller
// ====================

import { Request,  Response } from "express";
import { newsletterService } from "../services/newsletter.service";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";

export const newsletterController = {
  // ============================== SUBSCRIBE ==============================
  subscribe: catchAsyncHandler(async (req: Request, res: Response) => {
    // req.body already validated by validate(newsletterValidation) middleware
    const { email } = req.body as { email: string };
    const result = await newsletterService.subscribe(email);
    sendResponse(res, 201, "Subscribed successfully", result);
  }),

  // ============================== GET ALL Subscribers ==============================
  getAllSubscribers: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await newsletterService.getAllSubscribers(req.query);
    sendResponse(res, 200, "Subscribers fetched successfully", result);
  }),

  // ============================== DELETE Subscriber ==============================
  deleteSubscriber: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await newsletterService.deleteSubscriber(req.params.id as string);
    sendResponse(res, 200, "Subscriber deleted successfully", result);
  })

}
