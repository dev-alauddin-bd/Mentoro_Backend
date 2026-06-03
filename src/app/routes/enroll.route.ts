// ====================
// Enroll Routes (CLEAN)
// ====================

import { Router } from "express";
import { enrollController } from "../controllers/enroll.controller";
import { authentication, authorization } from "../middlewares/auth.middleware";
import { UserRole } from "../interfaces/user.interface";

const router = Router();

/**
 * ✅ ENROLL COURSE (FREE or PENDING for PAID)
 * - FREE → ACTIVE
 * - PAID → PENDING (no payment here)
 */
router.post(
  "/",
  authentication,
  authorization(UserRole.STUDENT),
  enrollController.enrollCourse
);

/**
 * ✅ GET MY ENROLLMENTS
 */
router.get(
  "/me",
  authentication,
  authorization(UserRole.STUDENT),
  enrollController.getMyEnrollments
);

/**
 * ❌ CANCEL ENROLLMENT (only FREE or pending)
 */
router.post(
  "/cancel",
  authentication,
  authorization(UserRole.STUDENT),
  enrollController.cancelEnrollment
);

export const enrollRouter: Router = router;