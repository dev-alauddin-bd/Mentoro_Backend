import { AiService } from "../services/ai.service";
// @ts-ignore
import { mockChain } from "@langchain/core/prompts";
import { PromptTemplate } from "@langchain/core/prompts";


process.env.OPENROUTER_API_KEY = "test-key";

// ================= MOCKS =================
jest.mock("../../lib/prisma", () => ({
  prisma: {
    course: { findMany: jest.fn().mockResolvedValue([]) },
    lesson: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));
jest.mock("../../lib/logger", () => ({
  error: jest.fn(console.error),
  info: jest.fn(),
  warn: jest.fn(),
}));

// IMPORTANT: mock full chain
jest.mock("@langchain/openai", () => ({
  ChatOpenAI: jest.fn(() => ({})),
}));

// Mock PromptTemplate to return a fresh mock chain per call
jest.mock("@langchain/core/prompts", () => {
  const mChain = {
    pipe: jest.fn(),
    invoke: jest.fn(),
  };
  mChain.pipe.mockReturnValue(mChain);
  return {
    __esModule: true,
    PromptTemplate: {
      fromTemplate: jest.fn(() => mChain),
    },
    mockChain: mChain,
  };
});

jest.mock("@langchain/core/output_parsers", () => ({
  StringOutputParser: jest.fn(() => ({})),
}));


describe("AiService FULL FIX", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (PromptTemplate.fromTemplate as jest.Mock).mockReturnValue(mockChain);
    mockChain.pipe.mockReturnValue(mockChain);
  });

  // ================= GENERATE CONTENT SUCCESS =================
  it("generateContent success", async () => {
    const json = JSON.stringify({
      title: "Test Course",
      shortDescription: "short",
      description: "long",
      seoTitle: "seo",
      seoDescription: "seo desc",
      tags: ["a"],
      learningOutcomes: ["x"],
      requirements: ["r"],
      targetAudience: ["t"],
      level: "BEGINNER",
      language: "English",
      duration: 60,
      categorySuggestion: "Web",
      thumbnailPrompt: "img",
    });

    mockChain.invoke.mockResolvedValueOnce(json);

    const res = await AiService.generateContent("react");

    expect(res.success).toBe(true);
    expect(res.data.title).toBe("Test Course");
  });

  // ================= MARKDOWN WRAPPER =================
  it("generateContent strips markdown json block", async () => {
    const json = JSON.stringify({ title: "Wrapped" });
    const wrapped = "```json\n" + json + "\n```";

    mockChain.invoke.mockResolvedValueOnce(wrapped);

    const res = await AiService.generateContent("node");

    expect(res.success).toBe(true);
    expect(res.data.title).toBe("Wrapped");
  });

  it("generateContent strips plain markdown block", async () => {
    const json = JSON.stringify({ title: "Plain Markdown" });
    const wrapped = "```\n" + json + "\n```";

    mockChain.invoke.mockResolvedValueOnce(wrapped);

    const res = await AiService.generateContent("test");

    expect(res.success).toBe(true);
    expect(res.data.title).toBe("Plain Markdown");
  });

  // ================= FAILURE BRANCH =================
  it("generateContent throws error", async () => {
    mockChain.invoke.mockRejectedValueOnce(new Error("fail"));

    await expect(AiService.generateContent("x")).rejects.toMatchObject({
      statusCode: 500,
      message: "Failed to generate AI content",
    });
  });

  // ================= LIVE SESSION SUCCESS =================
  it("generateLiveSessionContent success", async () => {
    const json = JSON.stringify({
      title: "Live Session",
      fullDescription: "desc",
      learningOutcomes: [],
      whoShouldAttend: [],
      keyTopics: [],
      seoKeywords: [],
    });

    mockChain.invoke.mockResolvedValueOnce(json);

    const res = await AiService.generateLiveSessionContent("React Live");

    expect(res.success).toBe(true);
    expect(res.data.title).toBe("Live Session");
  });

  // ================= LIVE SESSION FAILURE =================
  it("generateLiveSessionContent failure branch", async () => {
    mockChain.invoke.mockRejectedValueOnce(new Error("fail"));

    await expect(
      AiService.generateLiveSessionContent("test")
    ).rejects.toMatchObject({
      statusCode: 500,
      message: "Live session generation failed",
    });
  });

  it("extractJSON throws for invalid JSON format", async () => {
    mockChain.invoke.mockResolvedValueOnce("invalid text without json");
    await expect(
      AiService.generateLiveSessionContent("test")
    ).rejects.toMatchObject({
      statusCode: 500,
      message: "Live session generation failed",
    });
  });

  // ================= CHAT ASSISTANT =================
  it("chatAssistant success", async () => {
    const mockStream = { async *[Symbol.asyncIterator]() { yield "hello"; } };
    mockChain.stream = jest.fn().mockResolvedValueOnce(mockStream);
    
    const res = await AiService.chatAssistant("hi", []);
    expect(res).toBe(mockStream);
  });

  it("chatAssistant throws if API key missing", async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(AiService.chatAssistant("hi", [])).rejects.toMatchObject({
      statusCode: 500,
      message: "OPENROUTER_API_KEY is missing",
    });
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  it("chatAssistant throws error", async () => {
    mockChain.stream = jest.fn().mockRejectedValueOnce(new Error("chat error"));
    await expect(AiService.chatAssistant("hi", [])).rejects.toThrow("chat error");
  });
});