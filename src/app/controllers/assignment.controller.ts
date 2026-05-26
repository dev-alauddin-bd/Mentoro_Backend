//  ====================
//  Assignment Controller
// ====================

import { Request,  Response } from "express";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";
import { AssignmentService } from "../services/assignment.service";

export const assignmentController = {

  // ============================== CREATE Assignment ==============================
  createAssignment: catchAsyncHandler(async (req: Request, res: Response) => {
    const assignment = await AssignmentService.createAssignment(req.body);
    sendResponse(res, 201, "Assignment created successfully", assignment);
  }),

  // ============================== GET Instructor Assignments ==============================
  getAssignmentsIntoIntrutorCourses: catchAsyncHandler(async (req: Request, res: Response) => {
    const result = await AssignmentService.getAssignmentsIntoIntrutorCourses(req.user!.id, req.query);
    sendResponse(res, 200, "Instructor assignments fetched successfully", result);
  }),

  // ============================== UPDATE Assignment ==============================
  updateAssignment: catchAsyncHandler(async (req: Request, res: Response) => {
    const assignment = await AssignmentService.updateAssignment(req.params.id as string, req.body);
    sendResponse(res, 200, "Assignment updated successfully", assignment);
  }),

  // ============================== DELETE Assignment ==============================
  deleteAssignment: catchAsyncHandler(async (req: Request, res: Response) => {
    await AssignmentService.deleteAssignment(req.params.id as string);
    sendResponse(res, 200, "Assignment deleted successfully");
  }),

  // ============================== SUBMIT Assignment ==============================
  submitAssignment: catchAsyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const { assignmentId, content } = req.body;
    const submission = await AssignmentService.submitAssignment(
      assignmentId,
      studentId,
      content
    );

    sendResponse(res, 201, "Assignment submitted successfully", submission);
  })


}
