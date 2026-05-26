//  ====================
//     Module Routes
// ====================

import { Router } from "express";
import { moduleController } from "../controllers/module.controller";
import { authorization, authentication } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../interfaces/user.interface";
import {
  createModuleValidation,
  updateModuleValidation,
} from "../validations/module.validation";

const router = Router({ mergeParams: true });

// ============================== ADD Module (INSTRUCTOR) ==============================
router.post("/", authentication, authorization(UserRole.INSTRUCTOR), validate(createModuleValidation), moduleController.addModule);

// ============================== GET ALL Modules ==============================
router.get("/", moduleController.getAllModules);

// ==============================
// DYNAMIC ROUTES (with :id param) - must come last
// ==============================

// ============================== GET Module By Course ID (STUDENT) ==============================
router.get("/:courseId", authentication, authorization(UserRole.STUDENT), moduleController.getModuleByCourseId);

// ============================== UPDATE Module (INSTRUCTOR) ==============================
router.patch("/:moduleId", authentication, authorization(UserRole.INSTRUCTOR), validate(updateModuleValidation), moduleController.updateModule);

// ============================== DELETE Module (INSTRUCTOR) ==============================
router.delete("/:moduleId", authentication, authorization(UserRole.INSTRUCTOR), moduleController.deleteModule);

export const moduleRouter: Router = router;

