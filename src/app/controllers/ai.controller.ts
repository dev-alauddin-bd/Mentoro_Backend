//  ====================
//      AI Controller
// ====================

import { Request, RequestHandler, Response } from "express";
import { AiService } from "../services/ai.service";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";
import logger from "../../lib/logger";

// ============================== CHAT Assistant (SSE) ==============================
const chatAssistant = async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await AiService.chatAssistant(message, history || []);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    logger.error("Chat Controller Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
};

// ============================== GENERATE Quiz ==============================
const generateQuiz = catchAsyncHandler(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const quiz = await AiService.generateQuiz(lessonId as string);
  sendResponse(res, 200, "Quiz generated successfully", quiz);
});


const generateContent = catchAsyncHandler(async (req: Request, res: Response) => {
  const { topic } = req.body;
  const result = await AiService.generateContent(topic);
  sendResponse(res, 200, "Content generated successfully", result);
});

export const AiController: AIController = {
  chatAssistant,
  generateQuiz,
  generateContent,

};


type AIController = {
  chatAssistant: RequestHandler;
  generateQuiz: RequestHandler;
  generateContent: RequestHandler;

};