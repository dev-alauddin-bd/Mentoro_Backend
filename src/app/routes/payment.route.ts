//  ====================
//     Payment Routes
// ====================

import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { authentication, authorization } from "../middlewares/auth.middleware";
import { UserRole } from "../interfaces/user.interface";

const router = Router();

// ============================== CREATE Checkout ==============================
router.post("/checkout", authentication, authorization(UserRole.STUDENT), paymentController.createCheckout);

// ============================== REFUND Course ==============================
router.post("/refund", authentication, authorization(UserRole.STUDENT), paymentController.refundCourse);

// ============================== PAYMENT Callbacks ==============================
router.get("/success", paymentController.paymentSuccess);
router.get("/cancel", paymentController.paymentCancel);
router.get("/fail", paymentController.paymentFail);

export const paymentRouter: Router = router;
