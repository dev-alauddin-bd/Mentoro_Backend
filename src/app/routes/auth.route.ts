//  ====================
//      Auth Routes
// ====================

import { Router } from "express";
import { authControllers } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  signupSchema,


  loginSchema,
} from "../validations/auth.validation";

const router = Router();

// ============================== REGISTER ==============================
router.post("/register", validate(signupSchema), authControllers.register);

// ============================== LOGIN ==============================
router.post("/login", validate(loginSchema), authControllers.login);


// ============================== REFRESH Token ==============================
router.get("/refresh-token", authControllers.refreshToken);


// ============================== VERIFY Session ==============================
router.get("/verify-session", authControllers.verifySession);


// ============================== LOGOUT ==============================
router.post("/logout", authControllers.logout);

export const authRouter: Router = router;
