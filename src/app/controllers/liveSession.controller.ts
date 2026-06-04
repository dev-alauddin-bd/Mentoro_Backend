//  ====================
//  Live Session Controller
// ====================

import { Request, Response } from "express";
import { liveSessionService } from "../services/liveSession.service";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";
import { CustomAppError } from "../errors/customError";

export const liveSessionController = {

  // ============================== CREATE Session ==============================
  createSession: catchAsyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new CustomAppError(400,"Thumbnail is required");
    }
    const result = await liveSessionService.createSession(req.body);
    sendResponse(res, 201, "Session created successfully", result);
  }),


  // ============================== REGISTER For Session ==============================
  registerForSession: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await liveSessionService.registerForSession(req.body);
    sendResponse(res, 201, "Registration successful", result);
  }),

  // ============================== GET ALL Sessions ==============================
  getAllSessions: catchAsyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await liveSessionService.getAllSessions(req.query);
    sendResponse(res, 200, "Sessions fetched successfully", data, meta);
  }),

  // ============================== GET Session By ID ==============================
  getSessionById: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await liveSessionService.getSessionById(req.params.id as string);
    sendResponse(res, 200, "Session fetched successfully", result);
  }),


  // ============================== UPDATE Session ==============================
  updateSession: catchAsyncHandler(async (req: Request, res: Response) => {
    if(req.file){
      req.body.thumbnail = req.file.path;
    }
    const result = await liveSessionService.updateSession(req.params.id as string, req.body);
    sendResponse(res, 200, "Session updated successfully", result);
  }),

  // ============================== DELETE Session ==============================
  deleteSession: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await liveSessionService.deleteSession(req.params.id as string);
    sendResponse(res, 200, "Session deleted successfully", result);
  }),

  // ============================== GET Registrants ==============================
  getRegistrants: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await liveSessionService.getRegistrantsBySessionId(req.params.id as string, req.query);
    sendResponse(res, 200, "Registrants fetched successfully", result);
  })
}

