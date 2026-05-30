import { Request, Response,  } from "express";
import { AiService } from "../services/ai.service";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";
import logger from "../../lib/logger";


export const aiController = {

  // ================= CHAT (SSE STREAM) =================
   chatAssistant: async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body;

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
      logger.error("Chat SSE Error:", error);

      try {
        res.write(
          `data: ${JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
          })}\n\n`
        );
      } catch { }

      res.end();
    }
  },



  // ================= COURSE CONTENT =================
  generateCourseContent: catchAsyncHandler(
    async (req: Request, res: Response) => {
      const { topic } = req.body;

      const result = await AiService.generateContent(topic);

      sendResponse(res, 200, "Content generated successfully", result);
    }
  ),

  // ================= LIVE SESSION =================
  generateLiveSession: catchAsyncHandler(
    async (req: Request, res: Response) => {
      const { title } = req.body;

      const result = await AiService.generateLiveSessionContent(title);

      sendResponse(res, 200, "Live session generated successfully", result);
    }
  )

}
