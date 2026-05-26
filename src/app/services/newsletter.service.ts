import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";

// ============================== SUBSCRIBE ==============================
const subscribe = async (email: string) => {
  return await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: {}, // If already exists, do nothing
    create: { email },
  });
};

// ============================== GET ALL Subscribers ==============================
const getAllSubscribers = async (query: Record<string, unknown>) => {
  const page = Number(query.page as string) || 1;
  const limit = Number(query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [subscribers, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.newsletterSubscriber.count(),
  ]);

  return {
    subscribers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// ============================== DELETE Subscriber ==============================
const deleteSubscriber = async (id: string) => {
  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id } });
  if (!subscriber) throw new CustomAppError(404, "Subscriber not found for deletion");

  return await prisma.newsletterSubscriber.delete({
    where: { id },
  });
};

export const newsletterService = {
  subscribe,
  getAllSubscribers,
  deleteSubscriber
};
