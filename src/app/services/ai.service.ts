import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { prisma } from "../../lib/prisma";
import logger from "../../lib/logger";
import { CustomAppError } from "../errors/customError";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { searchKnowledgeBase } from "./rag.service";
import { SystemMessage, HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// ---------- Chat persistence helpers ----------
export const loadHistory = async (sessionId: string) => {
  const msgs = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
  return msgs.map((m) => ({ role: m.role as any, content: m.content }));
};

export const saveMessage = async (
  sessionId: string,
  role: string,
  content: string,
  userId?: string
) => {
  await prisma.chatMessage.create({
    data: { sessionId, role, content, userId: userId ?? null },
  });
};


// ================= MODEL =================
const getModel = () => {
  // Prefer native Google Generative AI when API key is available to avoid OpenRouter rate limits.
  if (process.env.GOOGLE_API_KEY) {
    return new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-3.1-flash-lite",
      temperature: 0.3,
    });
  }

  // Fallback to OpenRouter if Google key is not set.
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
  const clean = text.trim().replace(/```json|```/g, "");

  const start = clean.indexOf("{") !== -1 ? clean.indexOf("{") : clean.indexOf("[");
  const end = clean.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Invalid AI JSON response");
  }

  return clean.slice(start, end + 1);
};


// ================= CHAT ASSISTANT =================
const chatAssistant = async (
  message: string,
  history: any[],
  user?: any,
  sessionId?: string
) => {
  try {
    const model = getModel();

    // Load persisted history if empty and sessionId provided
    if ((!history || history.length === 0) && sessionId) {
      history = await loadHistory(sessionId);
    }
    // Persist incoming user message
    if (sessionId) {
      await saveMessage(sessionId, "user", message, user?.id);
    }
    const searchCourses = new DynamicStructuredTool({
      name: "searchCourses",
      description: "Search for courses by title, description, or category matching the query. Returns a list of courses with titles, descriptions, slugs, categories, prices, and IDs.",
      schema: z.object({
        query: z.string().describe("The search query or keyword"),
      }),
      func: async ({ query }) => {
        try {
          const courses = await prisma.course.findMany({
            where: {
              isPublished: true,
              isDeleted: false,
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                {
                  category: {
                    name: { contains: query, mode: "insensitive" },
                  },
                },
              ],
            },
            include: {
              category: { select: { name: true } },
            },
          });
          return JSON.stringify(courses);
        } catch (err: any) {
          return JSON.stringify({ error: err.message || "Search failed" });
        }
      },
    });

    const getCourseDetails = new DynamicStructuredTool({
      name: "getCourseDetails",
      description: "Retrieve comprehensive details for a specific course by its ID or slug, including modules, lessons, and assignments outline.",
      schema: z.object({
        courseIdOrSlug: z.string().describe("The course ID or slug (e.g., full-stack-web-development-bootcamp)"),
      }),
      func: async ({ courseIdOrSlug }) => {
        try {
          const course = await prisma.course.findFirst({
            where: {
              OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }],
              isPublished: true,
              isDeleted: false,
            },
            include: {
              modules: {
                where: { isDeleted: false },
                orderBy: { order: "asc" },
                include: {
                  lessons: {
                    where: { isDeleted: false },
                    orderBy: { order: "asc" },
                  },
                  assignments: {
                    where: { isDeleted: false },
                  },
                },
              },
              instructor: {
                select: { name: true, email: true },
              },
            },
          });
          return JSON.stringify(course || { error: "Course not found" });
        } catch (err: any) {
          return JSON.stringify({ error: err.message || "Failed to retrieve course details" });
        }
      },
    });

    const searchLessons = new DynamicStructuredTool({
      name: "searchLessons",
      description: "Search for specific lessons within courses by title or content matching the query.",
      schema: z.object({
        query: z.string().describe("The lesson topic or title keyword"),
      }),
      func: async ({ query }) => {
        try {
          const lessons = await prisma.lesson.findMany({
            where: {
              isDeleted: false,
              title: { contains: query, mode: "insensitive" },
            },
            select: {
              id: true,
              title: true,
              duration: true,
              order: true,
              module: {
                select: {
                  title: true,
                  course: {
                    select: {
                      title: true,
                      slug: true,
                    },
                  },
                },
              },
            },
            take: 10,
          });
          return JSON.stringify(lessons);
        } catch (err: any) {
          return JSON.stringify({ error: err.message || "Failed to search lessons" });
        }
      },
    });

    const listLiveSessions = new DynamicStructuredTool({
      name: "listLiveSessions",
      description: "List all upcoming and published live classes/sessions with dates, levels, key topics, and meeting links.",
      schema: z.object({}),
      func: async () => {
        try {
          const sessions = await prisma.liveSession.findMany({
            where: { isPublished: true },
            orderBy: { sessionDate: "asc" },
          });
          return JSON.stringify(sessions);
        } catch (err: any) {
          return JSON.stringify({ error: err.message || "Failed to list live sessions" });
        }
      },
    });

    const getUserProfile = new DynamicStructuredTool({
      name: "getUserProfile",
      description: "Get profile details of the currently logged-in user (name, email, role, phone). Only works if user is authenticated.",
      schema: z.object({}),
      func: async () => {
        if (!user) {
          return "User is not logged in. Tell the user to log in to access their profile.";
        }
        return JSON.stringify(user);
      },
    });

    const getUserEnrollments = new DynamicStructuredTool({
      name: "getUserEnrollments",
      description: "Get all courses that the currently logged-in user has enrolled in, along with enrollment status (ACTIVE, PENDING). Only works if user is authenticated.",
      schema: z.object({}),
      func: async () => {
        if (!user) {
          return "User is not logged in. Tell the user to log in to see their enrollments.";
        }
        try {
          const enrollments = await prisma.enrollment.findMany({
            where: { studentId: user.id },
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  price: true,
                },
              },
            },
          });
          return JSON.stringify(enrollments);
        } catch (err: any) {
          return JSON.stringify({ error: err.message || "Failed to get enrollments" });
        }
      },
    });

    const getLearningProgress = new DynamicStructuredTool({
      name: "getLearningProgress",
      description: "Get the user's progress tracking details (completed/incomplete lessons) for their enrolled courses. Only works if user is authenticated.",
      schema: z.object({}),
      func: async () => {
        if (!user) {
          return "User is not logged in. Tell the user to log in to see their learning progress.";
        }
        try {
          const progress = await prisma.lessonProgress.findMany({
            where: { studentId: user.id },
            include: {
              lesson: {
                select: {
                  title: true,
                  order: true,
                  duration: true,
                },
              },
            },
          });
          return JSON.stringify(progress);
        } catch (err: any) {
          return JSON.stringify({ error: err.message || "Failed to get progress" });
        }
      },
    });

    const enrollInCourse = new DynamicStructuredTool({
      name: "enrollInCourse",
      description: "Enroll the currently logged-in user in a specific course by its courseId. Only works if user is authenticated.",
      schema: z.object({
        courseId: z.string().describe("The ID of the course to enroll in"),
      }),
      func: async ({ courseId }) => {
        if (!user) {
          return "User is not logged in. You must be logged in to enroll in a course.";
        }
        try {
          const course = await prisma.course.findUnique({ where: { id: courseId } });
          if (!course) {
            return JSON.stringify({ error: `Course with ID ${courseId} not found.` });
          }

          const existing = await prisma.enrollment.findUnique({
            where: {
              studentId_courseId: {
                studentId: user.id,
                courseId: courseId,
              },
            },
          });

          if (existing) {
            return JSON.stringify({
              message: `User is already enrolled in "${course.title}".`,
              enrollment: existing,
            });
          }

          const enrollment = await prisma.enrollment.create({
            data: {
              studentId: user.id,
              courseId: courseId,
              status: "PENDING",
              amount: course.price,
              email: user.email,
              name: user.name,
              phone: user.phone || "",
            },
          });

          return JSON.stringify({
            success: true,
            message: `Successfully enrolled in "${course.title}"! Please complete the payment to activate.`,
            enrollment,
          });
        } catch (err: any) {
          return JSON.stringify({ error: err.message || "Failed to enroll in course" });
        }
      },
    });

    const updatePaymentStatus = new DynamicStructuredTool({
      name: "updatePaymentStatus",
      description: "Create or update the payment status (PENDING, COMPLETED, FAILED, REFUNDED) and update corresponding enrollment status (ACTIVE if COMPLETED) for a user's course in the database. Only works if user is authenticated.",
      schema: z.object({
        courseId: z.string().describe("The ID of the course"),
        status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).describe("The new payment status"),
      }),
      func: async ({ courseId, status }) => {
        if (!user) {
          return "User is not logged in. You must be logged in to update payment status.";
        }
        try {
          const enrollment = await prisma.enrollment.findUnique({
            where: {
              studentId_courseId: {
                studentId: user.id,
                courseId: courseId,
              },
            },
          });

          if (!enrollment) {
            return JSON.stringify({ error: "No enrollment found for this course. Please enroll in the course first." });
          }

          const payment = await prisma.payment.findFirst({
            where: {
              studentId: user.id,
              courseId: courseId,
            },
          });

          let updatedPayment;
          if (payment) {
            updatedPayment = await prisma.payment.update({
              where: { id: payment.id },
              data: { status },
            });
          } else {
            updatedPayment = await prisma.payment.create({
              data: {
                studentId: user.id,
                courseId: courseId,
                amount: enrollment.amount,
                status,
                enrollId: enrollment.id,
              },
            });
          }

          const enrollmentStatus = status === "COMPLETED" ? "ACTIVE" : "PENDING";
          await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { status: enrollmentStatus },
          });

          return JSON.stringify({
            success: true,
            message: `Payment status updated to ${status} and enrollment status updated to ${enrollmentStatus}!`,
            payment: updatedPayment,
          });
        } catch (err: any) {
          return JSON.stringify({ error: err.message || "Failed to update payment status" });
        }
      },
    });

    const tools = [
  // RAG tool for knowledge-base lookup
  new DynamicStructuredTool({
    name: "searchKnowledgeBase",
    description: "Search the knowledge base for relevant information based on a user query.",
    schema: z.object({ query: z.string().describe("Search query") }),
    func: async ({ query }) => {
      return await searchKnowledgeBase(query);
    },
  }),
      searchCourses,
      getCourseDetails,
      searchLessons,
      listLiveSessions,
      getUserProfile,
      getUserEnrollments,
      getLearningProgress,
      enrollInCourse,
      updatePaymentStatus,
      // ----- NEW: Payment link generation -----
      new DynamicStructuredTool({
        name: "createPaymentIntent",
        description: "Generate a Stripe payment link for a given course and user. Returns the URL to redirect the user to.",
        schema: z.object({
          courseId: z.string().describe("ID of the course to purchase"),
          userId: z.string().describe("ID of the user making the purchase"),
          amount: z.number().describe("Amount in the smallest currency unit (e.g., cents)"),
          currency: z.string().default("USD").describe("ISO currency code"),
        }),
        func: async ({ courseId, userId, amount, currency }) => {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
          // Create a Checkout Session directly; Stripe will internally create a PaymentIntent.
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
              {
                price_data: {
                  currency,
                  product_data: { name: `Course ${courseId}` }, 
                  unit_amount: amount,
                },
                quantity: 1,
              },
            ],
            mode: "payment",
            // Include metadata to identify the course and user.
            metadata: { courseId, userId },
            success_url: `${process.env.BACKEND_URL}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
          });
          return JSON.stringify({ paymentUrl: session.url });
        },
      }),
            new DynamicStructuredTool({
        name: "enrollWithPayment",
        description: "Create a Stripe checkout session for enrolling a user in a course. Returns the payment URL.",
        schema: z.object({
          courseId: z.string().describe("ID of the course to enroll"),
          userId: z.string().describe("ID of the user enrolling"),
        }),
        func: async ({ courseId, userId }) => {
          const { prisma } = await import("../../lib/prisma");
          const course = await prisma.course.findUnique({ where: { id: courseId } });
          if (!course) return JSON.stringify({ error: "Course not found" });
          const amount = Math.round(course.price * 100);
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
              {
                price_data: {
                  currency: "usd",
                  product_data: { name: `Course ${courseId}` },
                  unit_amount: amount,
                },
                quantity: 1,
              },
            ],
            mode: "payment",
            metadata: { courseId, userId },
            success_url: `${process.env.BACKEND_URL}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
          });
          return JSON.stringify({ paymentUrl: session.url });
        },
      }),
      ];

    const modelWithTools = model.bindTools(tools);

    const formattedHistory = (history || []).map((msg: any) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      } else {
        return new AIMessage(msg.content);
      }
    });

    const systemPrompt = `You are CourseMaster AI Assistant, a helpful and premium virtual learning mentor on the Mentoro LMS platform.
You have access to tools that interact directly with the LMS database.
Always use appropriate tools to query courses, lessons, upcoming live sessions, or manage student enrollments and payments.
If the user wants to check progress, see their enrollments, enroll in a course, or update a payment, check if they are logged in.
If the user profile is available, address them by name (e.g. "Hello John!"). If they are not logged in, explain politely that they must log in to perform that action.
When suggesting or showing courses, you can reference their details or IDs. Always respond clearly, naturally, and in the same language as the user.`;

    let messages: any[] = [
      new SystemMessage(systemPrompt),
      ...formattedHistory,
      new HumanMessage(message),
    ];

    let fullResponse = "";

    // Stream response and persist final assistant reply
    async function* streamChat() {
      while (true) {
        const response: any = await modelWithTools.invoke(messages);
        if (response.tool_calls && response.tool_calls.length > 0) {
          messages.push(response);
          for (const toolCall of response.tool_calls) {
            const selectedTool = tools.find((t) => t.name === toolCall.name);
            let toolOutput = "";
            if (selectedTool) {
              try {
                toolOutput = await (selectedTool as any).call(toolCall.args);
              } catch (err: any) {
                toolOutput = JSON.stringify({ error: err.message || "Tool execution failed" });
              }
            } else {
              toolOutput = `Tool ${toolCall.name} not found.`;
            }
            messages.push(
              new ToolMessage({
                tool_call_id: toolCall.id!,
                content: toolOutput,
                name: toolCall.name,
              })
            );
          }
          // Continue loop to get next response after handling tools
          continue;
        } else {
          // No tool calls, handle empty response
          if (response.content && response.content.trim().length > 0) {
            fullResponse = response.content;
          } else {
            // Provide a fallback message to avoid empty output
            fullResponse = "Sorry, I couldn't process your request. Please try rephrasing.";
          }
          yield fullResponse;
          break;
        }
      }
      // Save the complete assistant reply
      if (sessionId) {
        await saveMessage(sessionId, "assistant", fullResponse, user?.id);
      }
    }

    return streamChat();
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

