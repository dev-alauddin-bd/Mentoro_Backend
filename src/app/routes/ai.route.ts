import { Router } from "express";

import { authentication } from "../middlewares/auth.middleware";
import { authorization } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../interfaces/user.interface";
import { generateContentSchema } from "../validations/ai.validation";
import { aiController } from "../controllers/ai.controller";

const router = Router();

// ================= CHAT (PUBLIC SSE) =================
router.post("/chat", aiController.chatAssistant);

// ================= COURSE CONTENT =================
router.post(
  "/generate-course-content",
  authentication,
  authorization(UserRole.INSTRUCTOR, UserRole.ADMIN),
  validate(generateContentSchema),
  aiController.generateCourseContent
);

// ================= LIVE SESSION =================
router.post(
  "/generate-live-session",
  authentication,
  authorization(UserRole.INSTRUCTOR),
  aiController.generateLiveSession
);

// ================= MODULE QUIZ =================
router.post(
  "/generate-quiz/:moduleId",
  authentication,
  authorization(UserRole.INSTRUCTOR),
  aiController.generateQuiz
);

export const aiRouter: Router = router;