import { PaymentStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { CustomAppError } from "../errors/customError";

export const paymentService = {
  // ================= CREATE CHECKOUT =================
  async createCheckoutSession(studentId: string, courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) throw new CustomAppError(404, "Course not found");

    const user = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!user) throw new CustomAppError(404, "User not found");

    const alreadyEnrolled = await prisma.enrollment.findFirst({
      where: { studentId, courseId },
    });

    if (alreadyEnrolled) {
      throw new CustomAppError(400, "Already enrolled in this course");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      success_url: `${process.env.BACKEND_URL}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BACKEND_URL}/api/payments/cancel?session_id={CHECKOUT_SESSION_ID}`,

      customer_email: user.email,

      // ✅ FIXED: consistent metadata
      metadata: {
        studentId,
        courseId,
      },

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: course.title,
            },
            unit_amount: Math.round(course.price * 100),
          },
          quantity: 1,
        },
      ],
    });

    const enrollment = await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      update: {},
      create: {
        studentId,
        courseId,
        phone: user.phone || "N/A",
        email: user.email,
        name: user.name,
        amount: course.price,
        currency: "usd",
        status: PaymentStatus.PENDING,
      }
    });

    await prisma.payment.create({
      data: {
        amount: course.price,
        currency: "usd",
        status: PaymentStatus.PENDING,
        stripeSessionId: session.id,
        studentId,
        courseId,
        enrollId: enrollment.id,
      },
    });

    return { paymentUrl: session.url };
  },

  // ================= VERIFY PAYMENT + ENROLL =================
  async verifyPaymentAndEnroll(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") return null;

    const studentId = session.metadata?.studentId;
    const courseId = session.metadata?.courseId;

    if (!studentId || !courseId) return null;

    const existingPayment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
      include: { course: true },
    });

    if (existingPayment?.status === "COMPLETED") {
      return existingPayment; // idempotency safety
    }

    await prisma.$transaction(async (tx) => {
      // 1. update payment
      const payment = await tx.payment.update({
        where: { stripeSessionId: sessionId },
        data: {
          status: "COMPLETED",
          stripePaymentId: session.payment_intent as string,
        },
      });

      // 2. update enrollment safely
      await tx.enrollment.update({
        where: { id: payment.enrollId },
        data: {
          status: "COMPLETED",
          paymentId: payment.id,
        }
      });
    });

    return await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
      include: { course: true },
    });
  },

  // ================= CANCEL/FAIL PAYMENT =================
  async cancelPayment(sessionId: string) {
    const existingPayment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (!existingPayment || existingPayment.status === "COMPLETED") {
      return null;
    }

    return await prisma.payment.update({
      where: { stripeSessionId: sessionId },
      data: {
        status: "FAILED",
      },
    });
  },

  // ================= REFUND =================
  async refundCourse(studentId: string, courseId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        studentId,
        courseId,
        status: "COMPLETED",
      },
    });

    if (!payment) {
      throw new CustomAppError(400, "No payment found");
    }

    if (!payment.stripePaymentId) {
      throw new CustomAppError(400, "Invalid Stripe payment ID");
    }

    // 1. Stripe refund first
    await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
    });

    // 2. DB update in transaction
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED",
        },
      });

      await tx.enrollment.delete({
        where: {
          studentId_courseId: {
            studentId,
            courseId,
          },
        },
      });
    });

    return { message: "Refund successful" };
  },
};