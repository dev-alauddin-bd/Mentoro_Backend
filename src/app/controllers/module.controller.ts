//  ====================
//    Module Controller
// ====================

import { Request, Response } from "express";
import { moduleService } from "../services/module.service";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";

export const moduleController = {
  // ============================== ADD Module ==============================
  addModule: catchAsyncHandler(async (req: Request, res: Response) => {
    const { courseId, title } = req.body;
    const module = await moduleService.addModule(courseId, { title });
    sendResponse(res, 201, "Module added successfully", module);
  }),

  // ============================== UPDATE Module ==============================
  updateModule: catchAsyncHandler(async (req: Request, res: Response) => {
    const { moduleId } = req.params;
    const module = await moduleService.updateModule(moduleId as string, req.body);
    sendResponse(res, 200, "Module updated successfully", module);
  }),

  // ============================== DELETE Module ==============================
  deleteModule: catchAsyncHandler(async (req: Request, res: Response) => {
    const { moduleId } = req.params;
    await moduleService.deleteModule(moduleId as string);
    sendResponse(res, 200, "Module deleted successfully");
  }),

  // ============================== GET Modules By Course ID ==============================
  getModuleByCourseId: catchAsyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { data, meta } = await moduleService.getModulesByCourseId(courseId as string, req.query);
    sendResponse(res, 200, "Modules fetched successfully", data, meta);
  }),

  // ============================== GET ALL Modules ==============================
  getAllModules: catchAsyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await moduleService.getAllModules(req.query);
    sendResponse(res, 200, "All modules fetched successfully", data, meta);
  })

}
