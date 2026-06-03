import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { CustomAppError } from "../errors/customError";
import { EnrollmentStatus, PaymentStatus, PaymentType } from "@prisma/client";

export const paymentService = {
  // ================= CREATE CHECKOUT =================
  createCheckoutSession: async (
    studentId: string,
    courseId: string,
    enrollId: string
  ) => {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollId },
    });

    if (!enrollment) throw new CustomAppError(404, "Enrollment not found");

    const user = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!user) throw new CustomAppError(404, "User not found");

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) throw new CustomAppError(404, "Course not found");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      success_url: `${process.env.BACKEND_URL}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BACKEND_URL}/api/payments/cancel?session_id={CHECKOUT_SESSION_ID}`,

      customer_email: user.email,

      metadata: {
        studentId,
        courseId,
        enrollId,
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

    // ================= PAYMENT CREATE (FIXED) =================
    await prisma.payment.create({
      data: {
        amount: course.price,
        currency: "usd",
        status: PaymentStatus.PENDING,

        stripeSessionId: session.id,

        courseId: courseId,
        studentId: studentId,
        enrollId: enrollId,

        type: PaymentType.COURSE_PURCHASE,
      },
    });

    return {
      paymentUrl: session.url,
    };
  },

  // ================= VERIFY PAYMENT =================
  verifyPaymentAndEnroll: async (sessionId: string) => {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") return null;

    const studentId = session.metadata?.studentId!;
    const courseId = session.metadata?.courseId!;

    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (!payment) {
      return null;
    }
    if (payment.status === PaymentStatus.COMPLETED) {

      return payment;
    }

    return prisma.$transaction(async (tx) => {
      // 1. UPDATE PAYMENT
      const updatedPayment = await tx.payment.update({
        where: { stripeSessionId: sessionId },
        data: {
          status: PaymentStatus.COMPLETED,
          stripePaymentId: session.payment_intent as string,
        },
      });

      // 2. ACTIVATE ENROLLMENT
      await tx.enrollment.updateMany({
        where: {
          studentId,
          courseId,
        },
        data: {
          status: EnrollmentStatus.ACTIVE,
        },
      });

      return updatedPayment;
    });
  },

  // ================= CANCEL PAYMENT =================
  cancelPayment: async (sessionId: string) => {
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (!payment || payment.status === PaymentStatus.COMPLETED) return null;

    return prisma.payment.update({
      where: { stripeSessionId: sessionId },
      data: {
        status: PaymentStatus.FAILED,
      },
    });
  },

  // ================= REFUND COURSE =================
  refundCourse: async (studentId: string, courseId: string) => {
    const payment = await prisma.payment.findFirst({
      where: {
        studentId,
        courseId,
        status: PaymentStatus.COMPLETED,
      },
    });

    if (!payment) {
      throw new CustomAppError(400, "Payment not found");
    }

    if (!payment.stripePaymentId) {
      throw new CustomAppError(400, "Invalid Stripe payment");
    }

    await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
        },
      });

      await tx.enrollment.updateMany({
        where: {
          studentId,
          courseId,
        },
        data: {
          status: EnrollmentStatus.CANCELLED,
        },
      });
    });

    return {
      message: "Refund successful",
    };
  },
};