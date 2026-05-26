//  ====================
//    Dashboard Routes
// ====================

import express, { Router } from "express";
import { authorization, authentication } from "../middlewares/auth.middleware";
import { dashboardController } from "../controllers/dashboard.controller";
import { Role } from "@prisma/client";

const router = express.Router();

// ================= ADMIN ANALYTICS =================
router.get(
  "/admin-analytics",
  authentication,
  authorization(Role.admin),
  dashboardController.getAdminAnalytics
);

// ================= INSTRUCTOR ANALYTICS =================
router.get(
  "/instructor-analytics",
  authentication,
  authorization(Role.instructor),
  dashboardController.getInstructorAnalytics
);

// ================= STUDENT ANALYTICS =================
router.get(
  "/student-analytics",
  authentication,
  authorization(Role.student),
  dashboardController.getStudentAnalytics
);


export const dashboardRouter: Router = router;
