// ====================
// Payment Routes (CLEAN)
// ====================

import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { authentication, authorization } from "../middlewares/auth.middleware";
import { UserRole } from "../interfaces/user.interface";

const router = Router();

/**
 * ✅ CREATE CHECKOUT SESSION
 * ONLY handles Stripe + payment record
 */
router.post(
  "/checkout",
  authentication,
  authorization(UserRole.STUDENT),
  paymentController.createCheckout
);

/**
 * 🔥 STRIPE SUCCESS CALLBACK
 * activates enrollment
 */
router.get("/success", paymentController.paymentSuccess);

/**
 * ❌ PAYMENT CANCEL
 */
router.get("/cancel", paymentController.paymentCancel);

/**
 * ❌ PAYMENT FAIL
 */
router.get("/fail", paymentController.paymentFail);

/**
 * 💰 REFUND COURSE
 */
router.post(
  "/refund",
  authentication,
  authorization(UserRole.STUDENT),
  paymentController.refundCourse
);

export const paymentRouter: Router = router;