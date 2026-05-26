//  ====================
//     Review Routes
// ====================

import { Router } from "express";
import { reviewController } from "../controllers/review.controller";
import { authentication, authorization } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../interfaces/user.interface";
import { createReviewValidation } from "../validations/review.validation";

const router = Router();

// ============================== GET ALL Reviews ==============================
router.get("/", reviewController.getAllReviews);

// ============================== CREATE Review (STUDENT) ==============================
router.post("/", authentication, authorization(UserRole.STUDENT), validate(createReviewValidation), reviewController.createReview);

// ============================== DELETE Review ==============================
router.delete("/:id", authentication, authorization(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN), reviewController.deleteReview);

export const reviewRoutes: Router = router;

