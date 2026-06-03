import { Router } from "express";
import { courseController } from "../controllers/course.controller";
import { authentication, authorization } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { Role } from "@prisma/client";

import {
  createCourseValidation,
  updateCourseValidation,
  completeLessonValidation,
} from "../validations/course.validation";

import { upload } from "../utils/cloudinary";

const router = Router();

/* =========================================================
   PUBLIC COURSES API
========================================================= */

// GET all public courses
router.get("/", courseController.getAllPublicCourses);

// GET single course by slug (PUBLIC)
router.get("/slug/:slug", courseController.getCourseBySlug);


/* =========================================================
   STUDENT API
========================================================= */

// GET enrolled courses
router.get(
  "/me/enrolled",
  authentication,
  authorization(Role.student, Role.instructor),
  courseController.getStudentEnrolledCourses
);

// GET enrolled course modules
router.get(
  "/me/:courseId/modules",
  authentication,
  authorization(Role.student, Role.instructor),
  courseController.getStudentEnrolledCourseModules
);

// POST complete lesson
router.post(
  "/me/lesson/complete",
  authentication,
  authorization(Role.student),
  validate(completeLessonValidation),
  courseController.completeLesson
);


/* =========================================================
   INSTRUCTOR API
========================================================= */

// GET instructor courses
router.get(
  "/instructor/me",
  authentication,
  authorization(Role.instructor),
  courseController.getAllInstructorCourses
);

// CREATE course
router.post(
  "/",
  authentication,
  authorization(Role.instructor),
  upload.single("thumbnail"),
  validate(createCourseValidation),
  courseController.createCourse
);

// UPDATE course (BY ID)
router.patch(
  "/:id",
  authentication,
  authorization(Role.instructor),
  upload.single("thumbnail"),
  validate(updateCourseValidation),
  courseController.updateCourse
);

// TOGGLE publish (BY ID)
router.patch(
  "/:id/toggle",
  authentication,
  authorization(Role.instructor),
  courseController.togglePublish
);

// DELETE course (BY ID)
router.delete(
  "/:id",
  authentication,
  authorization(Role.admin, Role.instructor),
  courseController.deleteCourse
);

export const courseRouter = router;