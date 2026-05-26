//  ====================
//     Legal Controller
// ====================

import { Request,  Response } from "express";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";
import { legalService } from "../services/legal.service";

export const legalController ={

// ============================== CREATE OR UPDATE DOCUMENT ==============================
 createOrUpdateLegalDocument :catchAsyncHandler(async (req: Request, res: Response) => {
  const result = await legalService.createOrUpdateLegalDocument(req.body);
  sendResponse(res, 200, "Legal document saved successfully", result);
}),

// ============================== GET DOCUMENT BY SLUG ==============================
getLegalDocumentBySlug :catchAsyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await legalService.getLegalDocumentBySlug(slug as string);
  sendResponse(res, 200, "Legal document retrieved successfully", result);
}),

// ============================== GET ALL DOCUMENTS ==============================
 getAllLegalDocuments:catchAsyncHandler(async (req: Request, res: Response) => {
  const result = await legalService.getAllLegalDocuments();
  sendResponse(res, 200, "Legal documents retrieved successfully", result);
})
}

