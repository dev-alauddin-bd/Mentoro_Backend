import { paymentService } from "../services/payment.service";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { CustomAppError } from "../errors/customError";
import { PaymentStatus, EnrollmentStatus } from "@prisma/client";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    enrollment: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    course: { findUnique: jest.fn() },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb({
      payment: { update: jest.fn() },
      enrollment: { updateMany: jest.fn() },
    })),
  },
}));

jest.mock("../../lib/stripe", () => ({
  stripe: {
    checkout: { sessions: { create: jest.fn(), retrieve: jest.fn() } },
    refunds: { create: jest.fn() },
  },
}));

describe("Payment Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create checkout session for paid course", async () => {
    const studentId = "s2";
    const courseId = "c2";
    const enrollId = "e2";
    (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue({ id: enrollId });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: studentId, email: "paid@example.com" });
    (prisma.course.findUnique as jest.Mock).mockResolvedValue({ id: courseId, price: 99.99, title: "Paid Course" });
    (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({ id: "sess_456", url: "http://pay-paid" });
    const result = await paymentService.createCheckoutSession(studentId, courseId, enrollId);
    expect(result.paymentUrl).toBe("http://pay-paid");
    expect(prisma.payment.create).toHaveBeenCalled();
  });

  it("should cancel payment with unknown status (treated as pending)", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({ status: "UNKNOWN" });
    (prisma.payment.update as jest.Mock).mockResolvedValue({});
    const result = await paymentService.cancelPayment("sess_unknown");
    expect(result).toBeDefined();
  });

  it("should throw if enrollment not found", async () => {
    (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(paymentService.createCheckoutSession("s1", "c1", "e1")).rejects.toThrow(CustomAppError);
  });

  it("should throw if user not found", async () => {
    (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue({ id: "e1" });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(paymentService.createCheckoutSession("s1", "c1", "e1")).rejects.toThrow(CustomAppError);
  });

  it("should throw if course not found", async () => {
    (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue({ id: "e1" });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "s1" });
    (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(paymentService.createCheckoutSession("s1", "c1", "e1")).rejects.toThrow(CustomAppError);
  });

  it("should verify unpaid session returns null", async () => {
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({ payment_status: "unpaid" });
    const result = await paymentService.verifyPaymentAndEnroll("sess_123");
    expect(result).toBeNull();
  });

  it("should cancel pending payment", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({ status: PaymentStatus.PENDING });
    (prisma.payment.update as jest.Mock).mockResolvedValue({});
    const result = await paymentService.cancelPayment("sess_123");
    expect(result).toBeDefined();
  });

  it("should return null if payment not found for cancel", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);
    const result = await paymentService.cancelPayment("sess_123");
    expect(result).toBeNull();
  });

  it("should return null if payment is already completed for cancel", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({ status: PaymentStatus.COMPLETED });
    const result = await paymentService.cancelPayment("sess_123");
    expect(result).toBeNull();
  });

  it("should refund a completed payment", async () => {
    (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      stripePaymentId: "pay_123",
      status: PaymentStatus.COMPLETED,
    });
    (stripe.refunds.create as jest.Mock).mockResolvedValue({});
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
      const tx = {
        payment: { update: jest.fn().mockResolvedValue({}) },
        enrollment: { updateMany: jest.fn().mockResolvedValue({}) },
      };
      return cb(tx);
    });
    const res = await paymentService.refundCourse("s1", "c1");
    expect(res.message).toBe("Refund successful");
  });

  it("should verify paid session and activate enrollment", async () => {
    // existing test for pending payment case
    // Mock stripe session as paid
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      payment_status: "paid",
      metadata: { studentId: "s1", courseId: "c1" },
      payment_intent: "pi_123",
    });
    // Existing pending payment
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      status: PaymentStatus.PENDING,
    });
    // Mock transaction to update payment and enrollment
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
      const tx = {
        payment: { update: jest.fn().mockResolvedValue({ status: PaymentStatus.COMPLETED }) },
        enrollment: { updateMany: jest.fn().mockResolvedValue({}) },
      };
      return cb(tx);
    });
    const result = await paymentService.verifyPaymentAndEnroll("sess_123");
    expect(result).toEqual({ status: PaymentStatus.COMPLETED });
  });

  it("should return null when payment not found", async () => {
    // Mock stripe session as paid
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      payment_status: "paid",
      metadata: { studentId: "s1", courseId: "c1" },
      payment_intent: "pi_123",
    });
    // No payment found
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);
    const result = await paymentService.verifyPaymentAndEnroll("sess_123");
    expect(result).toBeNull();
  });

  it("should return existing completed payment", async () => {
    // Mock stripe session as paid
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      payment_status: "paid",
      metadata: { studentId: "s1", courseId: "c1" },
      payment_intent: "pi_123",
    });
    // Existing completed payment
    const completedPayment = { id: 1, status: PaymentStatus.COMPLETED };
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(completedPayment);
    const result = await paymentService.verifyPaymentAndEnroll("sess_123");
    expect(result).toEqual(completedPayment);
  });



  it("should throw when refund payment not found", async () => {
    (prisma.payment.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(paymentService.refundCourse("s1", "c1")).rejects.toThrow(CustomAppError);
  });

  it("should throw when stripe payment id missing", async () => {
    (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      status: PaymentStatus.COMPLETED,
      stripePaymentId: null,
    });
    await expect(paymentService.refundCourse("s1", "c1")).rejects.toThrow(CustomAppError);
  });
})
