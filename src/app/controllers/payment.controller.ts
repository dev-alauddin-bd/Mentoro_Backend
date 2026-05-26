//  ====================
//   Payment Controller
// ====================

import { Request, RequestHandler, Response } from "express";
import { paymentService } from "../services/payment.service";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";

// ============================== CREATE Checkout ==============================
const createCheckout = catchAsyncHandler(async (req: Request, res: Response) => {
  // req.body already validated by validate(enrollValidation) middleware
  const { courseId } = req.body as { courseId: string };
  const studentId = req.user!.id;
  const result = await paymentService.createCheckoutSession(studentId, courseId);
  sendResponse(res, 201, "Checkout session created", result);
});


const paymentSuccess = async (req: Request, res: Response) => {
  const sessionId = req.query.session_id as string;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (sessionId) {
    await paymentService.verifyPaymentAndEnroll(sessionId);
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful</title>
      <style>
        body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #09090b; color: #fafafa; text-align: center; }
        .container { background: #18181b; padding: 3rem; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid #27272a; max-width: 500px; width: 90%; }
        h1 { margin-top: 0; color: #4ade80; font-size: 2.25rem; font-weight: 900; letter-spacing: -0.025em; }
        p { margin-bottom: 2rem; color: #a1a1aa; line-height: 1.6; font-size: 1.125rem; }
        .btn { display: inline-block; padding: 0.875rem 2rem; background-color: #22c55e; color: #000; text-decoration: none; border-radius: 0.75rem; font-weight: 700; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.2); }
        .btn:hover { background-color: #16a34a; transform: translateY(-2px); box-shadow: 0 10px 20px -3px rgba(34, 197, 94, 0.3); }
        .icon { font-size: 5rem; margin-bottom: 1.5rem; filter: drop-shadow(0 0 20px rgba(74, 222, 128, 0.2)); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✅</div>
        <h1>Payment Successful!</h1>
        <p>Thank you for your purchase. Your payment was processed successfully, and you are now enrolled in the course.</p>
        <a href="${frontendUrl}/dashboard/student/my-courses" class="btn">Go to My Courses</a>
      </div>
    </body>
    </html>
  `;
  res.send(html);
};

const paymentCancel = (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Cancelled</title>
      <style>
        body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #09090b; color: #fafafa; text-align: center; }
        .container { background: #18181b; padding: 3rem; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid #27272a; max-width: 500px; width: 90%; }
        h1 { margin-top: 0; color: #fbbf24; font-size: 2.25rem; font-weight: 900; letter-spacing: -0.025em; }
        p { margin-bottom: 2rem; color: #a1a1aa; line-height: 1.6; font-size: 1.125rem; }
        .btn { display: inline-block; padding: 0.875rem 2rem; background-color: #f59e0b; color: #000; text-decoration: none; border-radius: 0.75rem; font-weight: 700; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.2); }
        .btn:hover { background-color: #d97706; transform: translateY(-2px); box-shadow: 0 10px 20px -3px rgba(245, 158, 11, 0.3); }
        .icon { font-size: 5rem; margin-bottom: 1.5rem; filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.2)); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">⚠️</div>
        <h1>Payment Cancelled</h1>
        <p>You cancelled the payment process. Your enrollment has not been completed.</p>
        <a href="${frontendUrl}" class="btn">Return to Home</a>
      </div>
    </body>
    </html>
  `;
  res.send(html);
};

const paymentFail = (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed</title>
      <style>
        body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #09090b; color: #fafafa; text-align: center; }
        .container { background: #18181b; padding: 3rem; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid #27272a; max-width: 500px; width: 90%; }
        h1 { margin-top: 0; color: #f87171; font-size: 2.25rem; font-weight: 900; letter-spacing: -0.025em; }
        p { margin-bottom: 2rem; color: #a1a1aa; line-height: 1.6; font-size: 1.125rem; }
        .btn { display: inline-block; padding: 0.875rem 2rem; background-color: #ef4444; color: #fff; text-decoration: none; border-radius: 0.75rem; font-weight: 700; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.2); }
        .btn:hover { background-color: #dc2626; transform: translateY(-2px); box-shadow: 0 10px 20px -3px rgba(239, 68, 68, 0.3); }
        .icon { font-size: 5rem; margin-bottom: 1.5rem; filter: drop-shadow(0 0 20px rgba(248, 113, 113, 0.2)); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">❌</div>
        <h1>Payment Failed</h1>
        <p>Something went wrong with your payment. Please try again.</p>
        <a href="${frontendUrl}" class="btn">Return to Home</a>
      </div>
    </body>
    </html>
  `;
  res.send(html);
};

const refundCourse = catchAsyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.body;
  const userId = req.user!.id;
  if (!courseId) {
    return sendResponse(res, 400, "courseId is required");
  }
  const result = await paymentService.refundCourse(userId, courseId);
  sendResponse(res, 200, "Refund processed", result);
});

export const paymentController: PaymentController = {
  createCheckout,

  paymentSuccess,
  paymentCancel,
  paymentFail,
  refundCourse,
};

type PaymentController = {
  createCheckout: RequestHandler;

  paymentSuccess: RequestHandler;
  paymentCancel: RequestHandler;
  paymentFail: RequestHandler;
  refundCourse: RequestHandler;
}