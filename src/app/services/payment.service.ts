//  ====================
//     Payment Service
// ====================

import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { CustomAppError } from "../errors/customError";
import logger from "../../lib/logger";

export const paymentService = {
  // ============================== CREATE Checkout Session ==============================
  async createCheckoutSession(userId: string, courseId: string) {
    logger.info("🚀 Starting payment checkout session...", { userId, courseId });

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new CustomAppError(404, "Course not found");
    }

    if (course.price === 0) {
      throw new CustomAppError(400, "This course is free. Please use standard enrollment.");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new CustomAppError(404, "User not found");
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existingEnrollment) {
      throw new CustomAppError(400, "Already enrolled in this course");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/cancel`,
      customer_email: user.email,
      client_reference_id: userId,
      metadata: { userId, courseId },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: course.title },
            unit_amount: Math.round(course.price * 100),
          },
          quantity: 1,
        },
      ],
    });

    await prisma.payment.create({
      data: {
        amount: course.price,
        currency: "usd",
        status: "PENDING",
        stripeSessionId: session.id,
        userId,
        courseId,
      },
    });

    return { paymentUrl: session.url };
  },

  // ============================== CREATE Featured Checkout Session ==============================
  async createFeaturedCheckoutSession(userId: string, courseId: string) {
    logger.info("🚀 Starting featured request checkout session...", { userId, courseId });

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new CustomAppError(404, "Course not found");
    
 
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new CustomAppError(404, "User not found");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/cancel`,
      customer_email: user.email,
      client_reference_id: userId,
      metadata: { userId, courseId, type: "FEATURED_REQUEST" },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `Featured Request: ${course.title}`,
              description: "Promotion to home page featured section"
            },
            unit_amount: 5000, // Fixed price for featured request: $50.00
          },
          quantity: 1,
        },
      ],
    });

    await prisma.payment.create({
      data: {
        amount: 50,
        currency: "usd",
        status: "PENDING",
        type: "FEATURED_REQUEST",
        stripeSessionId: session.id,
        userId,
        courseId,
      },
    });

    return { paymentUrl: session.url };
  },

  // ============================== VERIFY Payment and ENROLL ==============================
// ============================== VERIFY Payment and ENROLL ==============================
async verifyPaymentAndEnroll(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return false;
    }

    const userId = session.metadata?.userId;
    const courseId = session.metadata?.courseId;

    if (!userId || !courseId) {
      logger.error("❌ Missing metadata in Stripe session");
      return false;
    }

    await prisma.$transaction(async (tx) => {
      // Update payment status
      await tx.payment.update({
        where: { stripeSessionId: sessionId },
        data: {
          status: "COMPLETED",
          stripePaymentId: session.payment_intent as string,
        },
      });

      // Create enrollment
      await tx.enrollment.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        create: {
          userId,
          courseId,
        },
        update: {},
      });
    });

    logger.info("✅ Payment verified and enrollment completed", {
      sessionId,
      userId,
      courseId,
    });

    return true;
  } catch (error) {
    logger.error("❌ Error verifying payment session manually:", error);
    return false;
  }
},

  // ============================== REFUND Course ==============================
  async refundCourse(userId: string, courseId: string) {
    logger.info("🚀 Starting course refund process...", { userId, courseId });

    const payment = await prisma.payment.findFirst({
      where: {
        userId,
        courseId,
        status: "COMPLETED",
      },
    });

    if (!payment || !payment.stripePaymentId) {
      throw new CustomAppError(400, "No completed payment found for this course to refund.");
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!enrollment) {
      throw new CustomAppError(404, "You are not enrolled in this course.");
    }

    // Check 14-day refund policy
    const daysSincePayment = (Date.now() - new Date(payment.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePayment > 14) {
      throw new CustomAppError(400, "Refund period has expired. Refunds are only available within 14 days of purchase.");
    }

    try {
      // Create a refund via Stripe
      await stripe.refunds.create({
        payment_intent: payment.stripePaymentId,
      });

      await prisma.$transaction(async (tx) => {
        // Update payment status to REFUNDED
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "REFUNDED" },
        });

        // Remove enrollment
        await tx.enrollment.delete({
          where: { userId_courseId: { userId, courseId } },
        });
      });

      return { message: "Refund processed successfully. Course enrollment cancelled." };
    } catch (error) {
      logger.error("❌ Error processing refund:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process refund";
      throw new CustomAppError(500, errorMessage);
    }
  },
};
