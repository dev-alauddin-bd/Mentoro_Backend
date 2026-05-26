import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { CustomAppError } from "../errors/customError";

export const paymentService = {
  // ================= CREATE CHECKOUT =================
  async createCheckoutSession(studentId: string, courseId: string) {

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new CustomAppError(404, "Course not found");

    const user = await prisma.user.findUnique({ where: { id: studentId } });
    if (!user) throw new CustomAppError(404, "User not found");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${process.env.BACKEND_URL}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BACKEND_URL}/api/payments/cancel`,
      customer_email: user.email,
      metadata: { studentId, courseId },
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
        studentId,
        courseId,
      },
    });

    return { paymentUrl: session.url };
  },



  // ================= VERIFY =================
  async verifyPaymentAndEnroll(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") return false;

    const userId = session.metadata?.userId;
    const courseId = session.metadata?.courseId;

    if (!userId || !courseId) return false;


    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { stripeSessionId: sessionId },
        data: {
          status: "COMPLETED",
          stripePaymentId: session.payment_intent as string,
        },
      });

      await tx.enrollment.upsert({
        where: {
          studentId_courseId: {
            studentId: userId,
            courseId,
          },
        },
        create: {
          studentId: userId,
          courseId,
        },
        update: {},
      });
    });

    return true;
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

    await stripe.refunds.create({
      payment_intent: payment.stripePaymentId!,
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      });

      await tx.enrollment.delete({
        where: {
          studentId_courseId: {
            studentId,
            courseId,
          },
        }
      })
    });

    return { message: "Refund successful" };
  },
};