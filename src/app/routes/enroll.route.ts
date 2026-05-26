//  ====================
//     Enroll Routes
// ====================

import { Router } from "express";
import { enrollController } from "../controllers/enroll.controller";
import { authentication, authorization } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { enrollValidation } from "../validations/enroll.validation";
import { UserRole } from "../interfaces/user.interface";

const router = Router();

// ============================== ENROLL In Course ==============================
router.post("/", authentication, authorization(UserRole.STUDENT), validate(enrollValidation), enrollController.enrollCourse);

// ============================== GET My Enrollments ==============================
router.get("/me", authentication, authorization(UserRole.STUDENT), enrollController.getMyEnrollments);
router.post("/cancel", authentication, authorization(UserRole.STUDENT), validate(enrollValidation), enrollController.cancelEnrollment);

// ==============================
// DYNAMIC ROUTES (with :id param) - must come last
// ==============================

// ============================== GET Enrolled Content ==============================
router.get("/courses/:courseId", authentication, authorization(UserRole.STUDENT), enrollController.getEnrolledCourseContent);

export const enrollRouter: Router = router;