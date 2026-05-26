//  ====================
//      User Routes
// ====================

import express, { Router } from "express";
import { authorization, authentication } from "../middlewares/auth.middleware";
import { userController } from "../controllers/user.controller";
import { upload } from "../utils/cloudinary";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../interfaces/user.interface";
import {
  updateProfileValidation,
  updateUserRoleValidation,
  updateUserStatusValidation,
} from "../validations/user.validation";

const router = express.Router();

// ============================== GET ALL Users (ADMIN) ==============================
router.get("/", authentication, authorization(UserRole.ADMIN), userController.getAllUsers);

// ============================== UPDATE User Role (ADMIN) ==============================
router.patch("/update-role/:id", authentication, authorization(UserRole.ADMIN), validate(updateUserRoleValidation), userController.updateUserRole);

// ============================== UPDATE User Status (ADMIN) ==============================
router.patch("/update-status/:id", authentication, authorization(UserRole.ADMIN), validate(updateUserStatusValidation), userController.updateUserStatus);

// ============================== BECOME Instructor ==============================
router.post("/become-instructor", authentication, authorization(UserRole.STUDENT, UserRole.INSTRUCTOR), userController.becomeInstructor);

// ============================== UPDATE Profile ==============================
router.patch("/profile", authentication, upload.single("avatar"), validate(updateProfileValidation), userController.updateProfile);

export const userRouter: Router = router;
