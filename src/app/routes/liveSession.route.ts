//  ====================
//   Live Session Routes
// ====================

import express, { Router } from "express";
import { liveSessionController } from "../controllers/liveSession.controller";
import { authorization, authentication } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../interfaces/user.interface";
import {
  createLiveSessionValidation,
  updateLiveSessionValidation,
  registerSessionValidation,
} from "../validations/liveSession.validation";
import { upload } from "../utils/cloudinary";

const router = express.Router();

// ============================== CREATE Session (INSTRUCTOR) ==============================
router.post("/", authentication, authorization(UserRole.INSTRUCTOR), upload.single("thumbnail"),  liveSessionController.createSession);

// ============================== GET ALL Sessions ==============================
router.get("/", liveSessionController.getAllSessions);

// ============================== REGISTER For Session ==============================
router.post("/register", authentication, validate(registerSessionValidation), liveSessionController.registerForSession);

// ==============================
// DYNAMIC ROUTES (with :id param) - must come last
// ==============================

// ============================== GET Session By ID ==============================
router.get("/:id", liveSessionController.getSessionById);

// ============================== UPDATE Session (INSTRUCTOR) ==============================
router.patch("/:id", authentication, authorization(UserRole.INSTRUCTOR),upload.single("thumbnail"), validate(updateLiveSessionValidation), liveSessionController.updateSession);

// ============================== DELETE Session (INSTRUCTOR) ==============================
router.delete("/:id", authentication, authorization(UserRole.INSTRUCTOR), liveSessionController.deleteSession);

// ============================== GET Registrants (INSTRUCTOR) ==============================
router.get("/:id/registrants", authentication, authorization(UserRole.INSTRUCTOR), liveSessionController.getRegistrants);

export const liveSessionRoutes: Router = router;
