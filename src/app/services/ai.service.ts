import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { prisma } from "../../lib/prisma";
import logger from "../../lib/logger";
import { CustomAppError } from "../errors/customError";

// ================= MODEL =================
const getModel = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new CustomAppError(500, "OPENROUTER_API_KEY is missing");
  }

  return new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    modelName: "google/gemma-4-31b-it:free",
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

// ================= SAFE JSON EXTRACTOR =================
const extractJSON = (text: string) => {
  let clean = text.trim().replace(/```json|```/g, "");

  const start = clean.indexOf("{") !== -1 ? clean.indexOf("{") : clean.indexOf("[");
  const end = clean.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Invalid AI JSON response");
  }

  return clean.slice(start, end + 1);
};

// ================= QUIZ CACHE =================
const quizCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

// ================= CHAT ASSISTANT =================
const chatAssistant = async (message: string, history: unknown[]) => {
  try {
    const model = getModel();

    const prompt = PromptTemplate.fromTemplate(`
You are CourseMaster AI Assistant.

Context: {context}
History: {history}
User: {message}

Answer clearly in same language.
`);

    const [courses, lessons] = await Promise.all([
      prisma.course.findMany({ take: 3 }),
      prisma.lesson.findMany({ take: 2 }),
    ]);

    const context = JSON.stringify({ courses, lessons });

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    return await chain.stream({
      message,
      history: JSON.stringify(history),
      context,
    });
  } catch (error) {
    logger.error("Chat Error:", error);
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

// ================= LIVE SESSION =================


const generateLiveSessionContent = async (title: string) => {
  console.log(title)
  try {
    const model = getModel();

    const prompt = PromptTemplate.fromTemplate(`
Create LIVE SESSION content in JSON.

TITLE: {title}

Generate a detailed full description, learning outcomes, who should attend, key topics, and SEO keywords for the live session.

Format:
{{
  "title": "{title}",
  "fullDescription": "",
  "learningOutcomes": [],
  "whoShouldAttend": [],
  "keyTopics": [],
  "seoKeywords": []
}}
`);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const response = await chain.invoke({ title });
    const json = extractJSON(response);
    return {
      success: true,
      data: JSON.parse(json),
    };
  } catch (error) {
    logger.error("Live Session Error:", error);
    throw new CustomAppError(500, "Live session generation failed");
  }
};

// ================= EXPORT =================
export const AiService = {
  chatAssistant,

  generateContent,
  generateLiveSessionContent,
};

