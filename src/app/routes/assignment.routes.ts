//  ====================
//   Assignment Routes
// ====================

import { Router } from "express";
import { assignmentController } from "../controllers/assignment.controller";
import { authorization, authentication } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../interfaces/user.interface";
import {
  createAssignmentValidation,
  updateAssignmentValidation,
} from "../validations/assignment.validation";

const router = Router();

// ============================== CREATE Assignment (INSTRUCTOR) ==============================
router.post("/", authentication, authorization(UserRole.INSTRUCTOR), validate(createAssignmentValidation), assignmentController.createAssignment);

// ============================== GET Instructor Assignments ==============================
router.get("/", authentication, authorization(UserRole.INSTRUCTOR), assignmentController.getAssignmentsIntoIntrutorCourses);

// ==============================
// DYNAMIC ROUTES (with :id param) - must come last
// ==============================

// ============================== UPDATE Assignment (INSTRUCTOR) ==============================
router.patch("/:id", authentication, authorization(UserRole.INSTRUCTOR), validate(updateAssignmentValidation), assignmentController.updateAssignment);

// ============================== DELETE Assignment (ADMIN) ==============================
router.delete("/:id", authentication, authorization(UserRole.ADMIN), assignmentController.deleteAssignment);

export const assignmentRouter: Router = router;

