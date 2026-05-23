//  ====================
//     Course Routes
// ====================

import { Router } from "express";
import { courseController } from "../controllers/course.controller";
import { authorize, protect, optionalProtect } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../interfaces/user.interface";
import {
  createCourseValidation,
  updateCourseValidation,
  completeLessonValidation,
} from "../validations/course.validation";

const router = Router();

// ============================== CREATE Course (INSTRUCTOR) ==============================
router.post("/", protect, authorize(UserRole.INSTRUCTOR), validate(createCourseValidation), courseController.createCourse);

// ============================== GET ALL Courses (PUBLIC) ==============================
router.get("/", courseController.getAllCourses);

// ============================== GET My Enrolled Courses ==============================
router.get("/my-courses", protect, courseController.getMyCourses);

// ============================== MARK Lesson Completed ==============================
router.post("/complete-lesson", protect, validate(completeLessonValidation), courseController.completeLesson);


// ==============================
// DYNAMIC ROUTES (with :id param) - must come last
// ==============================

// ============================== GET Course By ID ==============================
router.get("/:id", optionalProtect, courseController.getCourseById);

// ============================== UPDATE Course ==============================
router.put("/:id", protect, authorize(UserRole.ADMIN, UserRole.INSTRUCTOR), validate(updateCourseValidation), courseController.updateCourse);

// ============================== TOGGLE Publish Status ==============================
router.patch("/:id/toggle-publish", protect, authorize(UserRole.ADMIN, UserRole.INSTRUCTOR), courseController.togglePublish);

// ============================== DELETE Course (ADMIN) ==============================
router.delete("/:id", protect, authorize(UserRole.ADMIN, UserRole.INSTRUCTOR), courseController.deleteCourse);


export const courseRouter: Router = router;