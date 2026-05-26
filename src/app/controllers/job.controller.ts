//  ====================
//     Job Controller
// ====================

import { Request,  Response } from "express";
import { jobService } from "../services/job.service";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";


export const jobController= {

  // ============================== CREATE Job ==============================
  createJob: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await jobService.createJob(req.body);
    sendResponse(res, 201, "Job created successfully", result);
  }),

  // ============================== GET ALL Jobs ==============================
  getAllJobs: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await jobService.getAllJobs(req.query);
    sendResponse(res, 200, "Jobs fetched successfully", result);
  }),

  // ============================== GET Single Job ==============================
  getJobById: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await jobService.getJobById(req.params.id as string);
    sendResponse(res, 200, "Job fetched successfully", result);
  }),

  // ============================== UPDATE Job ==============================
  updateJob: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await jobService.updateJob(req.params.id as string, req.body);
    sendResponse(res, 200, "Job updated successfully", result);
  }),

  // ============================== DELETE Job ==============================
  deleteJob: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await jobService.deleteJob(req.params.id as string);
    sendResponse(res, 200, "Job deleted successfully", result);
  }),

  // ============================== APPLY For Job ==============================
  applyForJob: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await jobService.applyForJob(req.body);
    sendResponse(res, 201, "Application submitted successfully", result);
  }),

  // ============================== GET Admin Applications ==============================
  getAllApplications: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await jobService.getAllApplications(req.query);
    sendResponse(res, 200, "Applications fetched successfully", result);
  })

}

