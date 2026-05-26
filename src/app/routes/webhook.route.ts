//  ====================
//     Webhook Routes
// ====================

import { Router } from "express";
import express from 'express';
import { webhookController } from "../controllers/webhook.controller";

const router = Router();

// ============================== STRIPE Webhook ==============================
router.post(
  "/",
  express.raw({ type: "application/json" }),
  webhookController.stripeWebhook
);

export const webhookRouter: Router = router;