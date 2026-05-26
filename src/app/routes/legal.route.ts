//  ====================
//      Legal Routes
// ====================

import { Router } from "express";
import { authorization, authentication } from "../middlewares/auth.middleware";
import { UserRole } from "../interfaces/user.interface";
import { legalController } from "../controllers/legal.controller";

const router = Router();

// ============================== PUBLIC ROUTES ==============================
router.get("/:slug", legalController.getLegalDocumentBySlug);
router.get("/", legalController.getAllLegalDocuments);

// ============================== ADMIN ROUTES ==============================
router.post(
  "/",
  authentication,
  authorization(UserRole.ADMIN),
  legalController.createOrUpdateLegalDocument
);

export const legalRouter: Router = router;
