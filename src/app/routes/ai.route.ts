//  ====================
//       AI Routes
// ====================

import { Router } from "express";
import { AiController } from "../controllers/ai.controller";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../interfaces/user.interface";
import { generateContentSchema,  } from "../validations/ai.validation";

const router = Router();

// ============================== CHAT Assistant ==============================
// Public — no auth required
router.post("/chat", AiController.chatAssistant);

// ============================== GENERATE Content ==============================
router.post("/generate-content", protect, authorize(UserRole.INSTRUCTOR, UserRole.ADMIN), validate(generateContentSchema), AiController.generateContent);


// ==============================
// DYNAMIC ROUTES (with :id param) - must come last
// ==============================

// ============================== GENERATE Quiz ==============================
router.get("/generate-quiz/:lessonId", protect, authorize(UserRole.INSTRUCTOR, UserRole.STUDENT), AiController.generateQuiz);

export const aiRouter: Router = router;
