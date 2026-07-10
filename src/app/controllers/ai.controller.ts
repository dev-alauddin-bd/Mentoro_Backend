import { Request, Response,  } from "express";
import { AiService } from "../services/ai.service";
import { catchAsyncHandler } from "../utils/catchAsyncHandler";
import { sendResponse } from "../utils/sendResponse";
import logger from "../../lib/logger";
import { verifyAccessToken } from "../utils/tokenHelpers";
import { prisma } from "../../lib/prisma";


export const aiController = {

  // ================= CHAT (SSE STREAM) =================
   chatAssistant: async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body;
      console.log("message===", message)
      console.log("history===", history)

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Extract user context from token if present
      let user: any = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        if (token) {
          try {
            const decoded = verifyAccessToken(token);
            const dbUser = await prisma.user.findUnique({ where: { id: decoded.id } });
            if (dbUser) {
              const { password, ...safeUser } = dbUser;
              user = safeUser;
            }
          } catch (err) {
            logger.warn("Chat Auth Warning: Invalid or expired token provided in chat");
          }
        }
      }

      const sessionId = req.body.sessionId || req.body.chatId || req.body.conversationId || user?.id;

      const stream = await AiService.chatAssistant(message, history || [], user, sessionId);

      for await (const chunk of stream) {
        const text = typeof chunk === "string" ? chunk : (chunk as any).content || "";
        res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
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
        )
      } catch { }

      res.end();
    }
  },



  // ================= COURSE CONTENT =================
  generateCourseContent: catchAsyncHandler(
    async (req: Request, res: Response) => {
      const { topic } = req.body;
 console.log("topic====", topic)
      const result = await AiService.generateContent(topic);
console.log("result====", result)
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
  ),
};
