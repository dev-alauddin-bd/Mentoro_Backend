//  ====================
//      Newsletter Routes
// ====================

import { Router } from "express";
import { newsletterController } from "../controllers/newsletter.controller";
import { authentication, authorization } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../interfaces/user.interface";
import { newsletterValidation } from "../validations/newsletter.validation";

const router = Router();

// ============================== SUBSCRIBE ==============================
router.post("/subscribe", validate(newsletterValidation), newsletterController.subscribe);

// ============================== ADMIN ROUTES ==============================
router.get("/", authentication, authorization(UserRole.ADMIN), newsletterController.getAllSubscribers);
router.delete("/:id", authentication, authorization(UserRole.ADMIN), newsletterController.deleteSubscriber);

export const newsletterRouter: Router = router;
