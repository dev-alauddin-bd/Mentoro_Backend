//  ====================
//      Job Routes
// ====================

import { Router } from "express";

import { authentication, authorization } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../interfaces/user.interface";
import {
  createJobValidation,
  updateJobValidation,
  jobApplicationValidation,
} from "../validations/job.validation";
import { jobController } from "../controllers/job.controller";

const router = Router();

// ============================== GET ALL Jobs ==============================
router.get("/", jobController.getAllJobs);

// ============================== APPLY For Job ==============================
router.post("/apply", authentication, authorization(UserRole.STUDENT), validate(jobApplicationValidation), jobController.applyForJob);

// ============================== CREATE Job (ADMIN) ==============================
router.post("/", authentication, authorization(UserRole.ADMIN), validate(createJobValidation), jobController.createJob);

// ==============================
// DYNAMIC ROUTES (with :id param) - must come last
// ==============================

// ============================== GET Admin Applications ==============================
router.get("/admin/applications", authentication, authorization(UserRole.ADMIN), jobController.getAllApplications);

// ============================== GET Single Job ==============================
router.get("/:id", jobController.getJobById);

// ============================== UPDATE Job (ADMIN) ==============================
router.patch("/:id", authentication, authorization(UserRole.ADMIN), validate(updateJobValidation), jobController.updateJob);

// ============================== DELETE Job (ADMIN) ==============================
router.delete("/:id", authentication, authorization(UserRole.ADMIN), jobController.deleteJob);

export const jobRouter: Router = router;

