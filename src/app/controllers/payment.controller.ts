
import { Request, Response, RequestHandler } from "express";
import { paymentService } from "../services/payment.service";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";
import env from "../config";

export const paymentController = {
  // ================= CREATE CHECKOUT =================
  createCheckout: catchAsyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const { courseId, enrollId } = req.body;

    const result = await paymentService.createCheckoutSession(
      studentId,
      courseId,
      enrollId
    );

    sendResponse(res, 201, "Checkout session created", result);
  }),

  // ================= PAYMENT SUCCESS =================
  paymentSuccess: catchAsyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.query.session_id as string;

    if (sessionId) {
      await paymentService.verifyPaymentAndEnroll(sessionId);
    }

    const frontendUrl = env.frontendUrl;


    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mentoro | Payment Successful</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #09090b; /* Deep background */
      color: #fff;
      overflow: hidden;
      position: relative;
    }
    /* BACKGROUND IMAGE & OVERLAY */
    body::before {
      content: "";
      position: absolute;
      inset: 0;
      background: url("${env.backendUrl}/public/images/bg.png") center/cover;
      filter: brightness(0.2);
      z-index: -2;
    }
    body::after {
      content: "";
      position: absolute;
      inset: 0;
      /* Orange glow at the top for brand */
      background: radial-gradient(circle at top, rgba(238, 123, 0, 0.2), transparent 60%);
      z-index: -1;
    }
    .card {
      background: rgba(24, 24, 27, 0.7);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(238, 123, 0, 0.2);
      padding: 3.5rem 2.5rem;
      border-radius: 24px;
      text-align: center;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(238, 123, 0, 0.1);
      animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .logo-img {
      width: 55px;
      height: 55px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
    .icon-wrapper {
      width: 90px;
      height: 90px;
      background: rgba(238, 123, 0, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      box-shadow: 0 0 30px rgba(238, 123, 0, 0.3);
      border: 1px solid rgba(238, 123, 0, 0.3);
      animation: pulse 2s infinite;
    }
    .icon {
      font-size: 3.5rem;
      filter: drop-shadow(0 0 10px rgba(238, 123, 0, 0.5));
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(238, 123, 0, 0.4); }
      70% { box-shadow: 0 0 0 20px rgba(238, 123, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(238, 123, 0, 0); }
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 0.75rem;
      letter-spacing: -0.5px;
    }
    p {
      color: #a1a1aa;
      line-height: 1.7;
      margin-bottom: 2rem;
      font-size: 1.05rem;
    }
    .payment-details {
      background: rgba(0, 0, 0, 0.4);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 2rem;
      text-align: left;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      font-size: 0.95rem;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      color: #a1a1aa;
    }
    .detail-value {
      color: #fff;
      font-weight: 600;
      text-align: right;
      max-width: 60%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .amount-value {
      color: #ee7b00;
      font-size: 1.1rem;
      font-weight: 800;
    }
    .btn {
      display: inline-block;
      padding: 1rem 2.5rem;
      background: linear-gradient(135deg, #ee7b00, #ff9500);
      color: #fff;
      font-weight: 700;
      font-size: 1.05rem;
      border-radius: 14px;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 10px 25px rgba(238, 123, 0, 0.3);
      position: relative;
      overflow: hidden;
      width: 100%;
    }
    .btn::after {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: 0.5s;
    }
    .btn:hover::after {
      left: 100%;
    }
    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 35px rgba(238, 123, 0, 0.4);
    }
    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1rem;
    }
    .btn-outline {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem 2.5rem;
      background: transparent;
      color: #ee7b00;
      font-weight: 600;
      font-size: 1rem;
      border-radius: 14px;
      border: 1.5px solid rgba(238, 123, 0, 0.5);
      cursor: pointer;
      transition: all 0.3s ease;
      width: 100%;
    }
    .btn-outline:hover {
      background: rgba(238, 123, 0, 0.1);
      border-color: #ee7b00;
      transform: translateY(-2px);
    }
    
    @media print {
      body {
        background: #fff !important;
      }
      body::before, body::after, .action-buttons {
        display: none !important;
      }
      .card {
        box-shadow: none !important;
        border: 1px solid #ddd !important;
        background: #fff !important;
        color: #000 !important;
        margin: 0;
        padding: 2rem;
        width: 100%;
        max-width: none;
      }
      h1, p, .detail-label, .detail-value {
        color: #000 !important;
      }
      .payment-details {
        background: transparent !important;
        border: 1px solid #ccc !important;
      }
      .icon-wrapper {
        animation: none !important;
        box-shadow: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="card">
   
    <div class="icon-wrapper">
      <div class="icon"> <img src="${env.backendUrl}/public/images/logo.svg" alt="Mentoro Logo" class="logo-img" onerror="this.src='${env.backendUrl}/public/images/logo.png'" /></div>
    </div>
    <h1>Enrollment Success</h1>
    <p>
      Your premium learning journey begins here. You have successfully enrolled.
    </p>


    <div class="action-buttons">
      <a href="${frontendUrl}/dashboard/student/my-courses" class="btn">
        Go to My Learning
      </a>


    </div>
  </div>
</body>
</html>
`;

    res.send(html);
  }),

  // ================= PAYMENT CANCEL =================
  paymentCancel: catchAsyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.query.session_id as string;

    if (sessionId) {
      await paymentService.cancelPayment(sessionId);
    }
    const frontendUrl = env.frontendUrl;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mentoro | Payment Cancelled</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #09090b;
          color: #fff;
          overflow: hidden;
          position: relative;
        }
        body::before {
          content: "";
          position: absolute;
          inset: 0;
          background: url("${env.backendUrl}/public/images/bg.png") center/cover;
          filter: brightness(0.2);
          z-index: -2;
        }
        body::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top, rgba(251, 191, 36, 0.15), transparent 60%);
          z-index: -1;
        }
        .card {
          background: rgba(24, 24, 27, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 3.5rem 2.5rem;
          border-radius: 24px;
          text-align: center;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.8);
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .logo-img {
          width: 55px;
          height: 55px;
          object-fit: contain;
          display: block;
          margin: 0 auto;
        }
        .icon-wrapper {
          width: 90px;
          height: 90px;
          background: rgba(251, 191, 36, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          border: 1px solid rgba(251, 191, 36, 0.2);
        }
        .icon {
          font-size: 3.5rem;
          filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.4));
        }
        h1 {
          font-size: 2.2rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.75rem;
          letter-spacing: -0.5px;
        }
        p {
          color: #a1a1aa;
          line-height: 1.7;
          margin-bottom: 2.5rem;
          font-size: 1.05rem;
        }
        .btn {
          display: inline-block;
          padding: 1rem 2.5rem;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          font-weight: 600;
          font-size: 1.05rem;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .btn:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon-wrapper">
          <div class="icon"><img src="${env.backendUrl}/public/images/logo.svg" alt="Mentoro Logo" class="logo-img" onerror="this.src='${env.backendUrl}/public/images/logo.png'" /></div>
        </div>
        <h1>Payment Cancelled</h1>
        <p>Your transaction was cancelled. If you're ready to upgrade your skills, you can try enrolling again.</p>
        <a href="${frontendUrl}" class="btn">Return to Home</a>
      </div>
    </body>
    </html>
  `;
    res.send(html);
  }),

  // ================= PAYMENT FAIL =================
  paymentFail: catchAsyncHandler(async (req: Request, res: Response) => {
    const frontendUrl = env.frontendUrl;


    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mentoro | Payment Failed</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #09090b;
          color: #fff;
          overflow: hidden;
          position: relative;
        }
        body::before {
          content: "";
          position: absolute;
          inset: 0;
          background: url("${env.backendUrl}/public/images/bg.png") center/cover;
          filter: brightness(0.2);
          z-index: -2;
        }
        body::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top, rgba(239, 68, 68, 0.15), transparent 60%);
          z-index: -1;
        }
        .card {
          background: rgba(24, 24, 27, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(239, 68, 68, 0.1);
          padding: 3.5rem 2.5rem;
          border-radius: 24px;
          text-align: center;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(239, 68, 68, 0.05);
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .logo-img {
          width: 55px;
          height: 55px;
          object-fit: contain;
          display: block;
          margin: 0 auto;
        }
        .icon-wrapper {
          width: 90px;
          height: 90px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .icon {
          font-size: 3.5rem;
          filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.4));
        }
        h1 {
          font-size: 2.2rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.75rem;
          letter-spacing: -0.5px;
        }
        p {
          color: #a1a1aa;
          line-height: 1.7;
          margin-bottom: 2.5rem;
          font-size: 1.05rem;
        }
        .btn {
          display: inline-block;
          padding: 1rem 2.5rem;
          background: #ef4444;
          color: #fff;
          font-weight: 600;
          font-size: 1.05rem;
          border-radius: 14px;
          text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: 0 10px 25px rgba(239, 68, 68, 0.2);
        }
        .btn:hover {
          transform: translateY(-2px);
          background: #dc2626;
          box-shadow: 0 15px 35px rgba(239, 68, 68, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon-wrapper">
          <div class="icon"><img src="${env.backendUrl}/public/images/logo.svg" alt="Mentoro Logo" class="logo-img" onerror="this.src='${env.backendUrl}/public/images/logo.png'" /></div>
        </div>
        <h1>Payment Failed</h1>
        <p>Something went wrong with your transaction. Please verify your payment details and try again.</p>
        <a href="${frontendUrl}" class="btn">Try Again</a>
      </div>
    </body>
    </html>
  `;
    res.send(html);
  }),

  // ================= REFUND COURSE =================
  refundCourse: catchAsyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const { courseId } = req.body;

    const result = await paymentService.refundCourse(
      studentId,
      courseId
    );

    sendResponse(res, 200, "Refund successful", result);
  }),
};