//  ====================
//       AI Service
// ====================

import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { prisma } from "../../lib/prisma";
import logger from "../../lib/logger";
import { CustomAppError } from "../errors/customError";

// Helper function to get the model via OpenRouter
const getModel = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new CustomAppError(500, "OPENROUTER_API_KEY is not defined in environment variables");
  }

  return new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    modelName: "google/gemini-2.0-flash-001",
    temperature: 0.3,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://mentoro-rho.vercel.app",
        "X-Title": "Mentoro LMS",
      },
    },
  });
};

// ============================== CHAT Assistant ==============================
const chatAssistant = async (message: string, history: unknown[]) => {
  try {
    const chatModel = getModel();

    // 1. Extract keywords for better RAG search
    const cleanMessage = message.toLowerCase()
      .replace(/give|me|show|course|what|is|how|to|the|a|an/g, "")
      .trim();

    const words = cleanMessage.split(/\s+/).filter(w => w.length > 2);

    const searchFilter = words.length > 0
      ? words.flatMap(word => [
        { title: { contains: word, mode: 'insensitive' as const } },
        { description: { contains: word, mode: 'insensitive' as const } },
        { category: { name: { contains: word, mode: 'insensitive' as const } } }
      ])
      : [
        { title: { contains: message, mode: 'insensitive' as const } },
        { description: { contains: message, mode: 'insensitive' as const } }
      ];

    // 2. Fetch relevant context in parallel
    const [relevantCourses, relevantLessons] = await Promise.all([
      prisma.course.findMany({
        where: { OR: searchFilter },
        take: 3,
        select: {
          title: true,
          description: true,
          thumbnail: true,
          category: { select: { name: true } }
        }
      }),
      prisma.lesson.findMany({
        where: {
          OR: words.length > 0
            ? words.flatMap(word => [
              { title: { contains: word, mode: 'insensitive' as const } },
              { content: { contains: word, mode: 'insensitive' as const } }
            ])
            : [{ title: { contains: message, mode: 'insensitive' as const } }]
        },
        take: 2,
        select: { title: true, content: true }
      })
    ]);

    const context = JSON.stringify({ courses: relevantCourses, lessons: relevantLessons });

    // 3. Updated Prompt
    const prompt = PromptTemplate.fromTemplate(`
      You are "CourseMaster AI Assistant". 
      
      CRITICAL INSTRUCTIONS:
      1. ALWAYS respond in the SAME LANGUAGE as the user's last message.
      2. Use Markdown for formatting (bold, bullet points, headers).
      3. Use the provided Context to answer. If a course matches, mention its Category, Title, and Description.
      
      Context from Database: {context}
      
      User History: {history}
      User Question: {message}
      
      AI Response:`);

    const chain = prompt.pipe(chatModel).pipe(new StringOutputParser());

    return await chain.stream({
      message,
      history: JSON.stringify(history),
      context: context
    });
  } catch (error) {
    logger.error("Chat AI Error (Formatted RAG):", error);
    throw error;
  }
};

// ============================== GENERATE Quiz ==============================
const generateQuiz = async (lessonId: string) => {
  try {
    const chatModel = getModel();

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        content: true,
        module: {
          select: {
            title: true,
            course: { select: { title: true } }
          }
        }
      }
    });

    if (!lesson) {
      throw new CustomAppError(404, "Lesson not found");
    }

    const courseTitle = lesson.module?.course?.title || "N/A";
    const moduleTitle = lesson.module?.title || "N/A";

    const prompt = PromptTemplate.fromTemplate(`
      Task: Generate a 5-question MCQ quiz.
      Context:
      - Course: {courseTitle}
      - Module: {moduleTitle}
      - Lesson: {lessonTitle}
      - Content: {content}

      CRITICAL:
      1. Return ONLY a JSON array. 
      2. Questions MUST be strictly based on the provided content.
      3. Format: [{{ "question": "string", "options": ["a", "b", "c", "d"], "correctAnswer": "string" }}]
    `);

    const chain = prompt.pipe(chatModel).pipe(new StringOutputParser());

    const response = await chain.invoke({
      courseTitle,
      moduleTitle,
      lessonTitle: lesson.title,
      content: lesson.content || "General knowledge about " + lesson.title,
    });

    const cleanResponse = response.substring(
      response.indexOf("["),
      response.lastIndexOf("]") + 1
    );

    return JSON.parse(cleanResponse);
  } catch (error) {
    logger.error("Quiz AI Error:", error);
    throw error;
  }
};


// ============================== GENERATE CONTENT ==============================
const generateContent = async (topicOrDraft: string) => {
  try {
    const chatModel = getModel();

    const prompt = PromptTemplate.fromTemplate(`
      Task:
      Generate complete professional LMS course content based on the topic.

      Input:
      {topic}

      CRITICAL RULES:
      1. Return ONLY valid JSON.
      2. No markdown.
      3. No extra text.
      4. Generate realistic professional educational content.
      5. Description should be engaging and SEO optimized.

      JSON FORMAT:
      {{
        "title": "string",
        "shortDescription": "string",
        "description": "string",
        "seoTitle": "string",
        "seoDescription": "string",
        "tags": ["tag1", "tag2"],
        "learningOutcomes": [
          "outcome 1",
          "outcome 2"
        ],
        "requirements": [
          "requirement 1",
          "requirement 2"
        ],
        "targetAudience": [
          "audience 1",
          "audience 2"
        ],
        "level": "BEGINNER",
        "language": "English",
        "duration": 120,
        "categorySuggestion": "Web Development",
        "thumbnailPrompt": "AI image prompt for thumbnail generation"
      }}

      IMPORTANT:
      - title = 3-8 words
      - shortDescription = 1 sentence
      - description = 2-4 paragraphs
      - duration = total minutes
      - tags = max 8
      - learningOutcomes = 4-8 items
      - requirements = 3-5 items
      - targetAudience = 2-5 items
    `);

    const chain = prompt
      .pipe(chatModel)
      .pipe(new StringOutputParser());

    const response = await chain.invoke({
      topic: topicOrDraft || "A generic online course",
    });

    let cleanResponse = response.trim();

    // Remove markdown wrappers
    if (cleanResponse.startsWith("```json")) {
      cleanResponse = cleanResponse
        .replace("```json", "")
        .replace("```", "")
        .trim();
    } else if (cleanResponse.startsWith("```")) {
      cleanResponse = cleanResponse
        .replace(/```/g, "")
        .trim();
    }

    const parsed = JSON.parse(cleanResponse);

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    logger.error("Generate Content AI Error:", error);

    throw new CustomAppError(
      500,
      "Failed to generate AI content"
    );
  }
};

export const AiService = {
  chatAssistant,
  generateQuiz,
  generateContent,

};

