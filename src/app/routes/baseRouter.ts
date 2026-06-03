//  ====================
//      Base Router
// ====================

import { Router } from "express";
import { authRouter } from "./auth.route";
import { courseRouter } from "./course.route";
import { categoryRouter } from "./category.route";
import { moduleRouter } from "./module.routes";
import { assignmentRouter } from "./assignment.routes";
import { dashboardRouter } from "./dashboard.route";
import { userRouter } from "./user.route";
import { reviewRoutes } from "./review.route";
import { paymentRouter } from "./payment.route";
import { enrollRouter } from "./enroll.route";
import { lessonRouter } from "./lesson.route";
import { studentSubmissionRouter } from "./studentSubmission.route";
import { aiRouter } from "./ai.route";
import { liveSessionRoutes } from "./liveSession.route";

const router = Router();

// ============================== DEFINE All Routes ==============================
const routes = [
  { path: "/auth", handler: authRouter },
  { path: "/courses", handler: courseRouter },
  { path: "/categories", handler: categoryRouter },
  { path: "/modules", handler: moduleRouter },
  { path: "/lessons", handler: lessonRouter },
  { path: "/enrollments", handler: enrollRouter },
  { path: "/assignments", handler: assignmentRouter },
  { path: "/reviews", handler: reviewRoutes },
  { path: "/ai", handler: aiRouter },
  { path: "/live-sessions", handler: liveSessionRoutes },
  { path: "/dashboard", handler: dashboardRouter },
  { path: "/users", handler: userRouter },
  { path: "/submissions", handler: studentSubmissionRouter },
  { path: "/payments", handler: paymentRouter },

];

// ============================== ATTACH Routers ==============================
routes.forEach((route) => {
  router.use(route.path, route.handler);
});

export const baseRouter: Router = router;
