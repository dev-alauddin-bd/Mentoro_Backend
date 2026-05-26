import { Router } from "express";
import { courseController } from "../controllers/course.controller";
import { authentication, authorization, } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { Role } from "@prisma/client";

import {
  createCourseValidation,
  updateCourseValidation,
  completeLessonValidation,
} from "../validations/course.validation";
import { upload } from "../utils/cloudinary";

const router = Router();

// ================= CREATE COURSE =================
router.post(
  "/",
  authentication,
  authorization(Role.instructor),
  upload.single("thumbnail"),
  validate(createCourseValidation),
  courseController.createCourse
);

// ================= MY COURSES =================
router.get(
  "/my-courses",
  authentication,
  courseController.getMyCourses
);

// ================= COMPLETE LESSON =================
router.post(
  "/complete-lesson",
  authentication,
  validate(completeLessonValidation),
  courseController.completeLesson
);

// ================= GET ALL PUBLIC COURSES =================
router.get("/", courseController.getAllPublicCourses);

// ================= GET ALL INSTRUCTOR COURSES =================
router.get("/instructor", authentication, authorization(Role.instructor), courseController.getInstructorCourses);

// ================= TOGGLE PUBLISH =================
router.patch(
  "/:id/toggle-publish",
  authentication,
  authorization(Role.instructor),
  courseController.togglePublish
);

// ================= UPDATE COURSE =================
router.patch(
  "/:id",
  authentication,
  authorization(Role.instructor),
  upload.single("thumbnail"),
  validate(updateCourseValidation),
  courseController.updateCourse
);

// ================= DELETE COURSE =================
router.delete(
  "/:id",
  authentication,
  authorization(Role.admin, Role.instructor),
  courseController.deleteCourse
);

// ================= GET COURSE BY ID =================
router.get(
  "/:id",

  courseController.getCourseById
);

export const courseRouter: Router = router;