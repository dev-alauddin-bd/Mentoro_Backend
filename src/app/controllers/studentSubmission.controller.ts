//  ====================
//   Student Submission
//      Controller
// ====================

import { Request, Response } from "express";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";
import { AssignmentService } from "../services/assignment.service";

// ============================== SUBMIT Assignment ==============================
export const studentSubmissionController = {
  submitAssignment: catchAsyncHandler(async (req: Request, res: Response) => {
    const user = req.user as { id: string };

    const { assignmentId, content } = req.body;

    const submission = await AssignmentService.submitAssignment(
      assignmentId,
      user.id,
      content
    );

    sendResponse(res, 201, "Assignment submitted successfully", submission);
  }),
};