//  ====================
//     Lesson Routes
// ====================

import { Router } from "express";
import { lessonController } from "../controllers/lesson.controller";
import { authorization, authentication } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../interfaces/user.interface";
import {
  createLessonValidation,
  updateLessonValidation,
} from "../validations/lesson.validation";

const router = Router();

// ============================== ADD Lesson (INSTRUCTOR) ==============================
router.post("/", authentication, authorization(UserRole.INSTRUCTOR), validate(createLessonValidation), lessonController.addLesson);

// ============================== GET ALL Lessons ==============================
router.get("/", authentication, authorization(UserRole.INSTRUCTOR, UserRole.STUDENT), lessonController.getAllLessons);

// ==============================
// DYNAMIC ROUTES (with :id param) - must come last
// ==============================

// ============================== GET Lesson By ID ==============================
router.get("/:lessonId", authentication, authorization(UserRole.INSTRUCTOR, UserRole.STUDENT), lessonController.getLessonById);

// ============================== UPDATE Lesson (INSTRUCTOR) ==============================
router.patch("/:lessonId", authentication, authorization(UserRole.INSTRUCTOR), validate(updateLessonValidation), lessonController.updateLesson);

// ============================== DELETE Lesson (INSTRUCTOR) ==============================
router.delete("/:lessonId", authentication, authorization(UserRole.INSTRUCTOR), lessonController.deleteLesson);

export const lessonRouter: Router = router;

