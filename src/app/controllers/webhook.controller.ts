//  ====================
//   Webhook Controller (FIXED)
// ====================

import { Request, Response } from "express";
import { stripe } from "../../lib/stripe";
import { prisma } from "../../lib/prisma";
import logger from "../../lib/logger";
export const webhookController = {
  // =========================== Stripe webhook=============================
  stripeWebhook: async (req: Request, res: Response) => {
    logger.info("🔥 Stripe Webhook Received");

    const sig = req.headers["stripe-signature"];
    if (!sig) {
      logger.warn("❌ Missing Stripe signature");
      return res.status(400).send("Missing signature");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err) {
      logger.error("❌ Webhook signature verification failed", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      return res.status(400).send("Invalid signature");
    }

    // ===================== PAYMENT SUCCESS =====================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;

      const userId = session.metadata?.userId;
      const courseId = session.metadata?.courseId;

      if (!userId || !courseId) {
        logger.warn("❌ Missing metadata in checkout session");
        return res.status(200).json({ received: true });
      }

      try {
        // ✅ GET STUDENT PROFILE
        const studentProfile = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!studentProfile) {
          logger.error("❌ Student profile not found");
          return res.status(200).json({ received: true });
        }

        await prisma.$transaction(async (tx) => {
          // 1. Update payment
          await tx.payment.update({
            where: { stripeSessionId: session.id },
            data: {
              status: "COMPLETED",
              stripePaymentId: session.payment_intent as string,
            },
          });

          // 2. Create enrollment (FIXED)
          await tx.enrollment.upsert({
            where: {
              studentId_courseId: {
                studentId: studentProfile.id,
                courseId,
              },
            },
            create: {
              studentId: studentProfile.id,
              courseId,
            },
            update: {},
          });
        });

        logger.info("✅ Payment + Enrollment successful");
      } catch (err) {
        logger.error("❌ Webhook DB error:", err);
      }
    }

    // ===================== FAILED / EXPIRED =====================
    if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const session = event.data.object as any;

      try {
        await prisma.payment.update({
          where: { stripeSessionId: session.id },
          data: {
            status: "FAILED",
          },
        });

        logger.info("❌ Payment marked FAILED");
      } catch (err) {
        logger.error("❌ Failed to update payment:", err);
      }
    }

    return res.status(200).json({ received: true });
  }
}

