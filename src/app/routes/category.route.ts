//  ====================
//     Category Routes
// ====================

import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import { authentication, authorization } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../interfaces/user.interface";
import {
  createCategoryValidation,
  updateCategoryValidation,
} from "../validations/category.validation";

const router = Router();

// ============================== GET ALL Categories ==============================
router.get("/", categoryController.getCategories);

// ============================== CREATE Category (ADMIN) ==============================
router.post("/", authentication, authorization(UserRole.ADMIN, UserRole.INSTRUCTOR), validate(createCategoryValidation), categoryController.createCategory);

// ==============================
// DYNAMIC ROUTES (with :id param) - must come last
// ==============================

// ============================== UPDATE Category (ADMIN) ==============================
router.put("/:id", authentication, authorization(UserRole.ADMIN), validate(updateCategoryValidation), categoryController.updateCategory);

// ============================== DELETE Category (ADMIN) ==============================
router.delete("/:id", authentication, authorization(UserRole.ADMIN), categoryController.deleteCategory);

export const categoryRouter: Router = router;

