import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";
import logger from "../../lib/logger";
import { getQueryObject, IQuery } from "../utils/query";

export const lessonService = {

  // ============================== GET ALL LESSONS ==============================
  getAllLessons: async (moduleId?: string, query: IQuery = {}) => {
    const q = getQueryObject(query);
    const page = Number(q.page || 1);
    const limit = Number(q.limit || 10);
    const skip = (page - 1) * limit;
    const where: any = moduleId ? { moduleId } : {};
    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          videoUrl: true,
          duration: true,
          moduleId: true,
          order: true,

          module: {
            select: {
              title: true,
              course: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      }),
      prisma.lesson.count({ where }),
    ]);
    const meta = { page, limit, totalPages: Math.ceil(total / limit) };
    return { data: lessons, meta };
  },

  // ============================== GET LESSON BY ID ==============================
  getLessonById: async (lessonId: string) => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        content: true,
        videoUrl: true,
        duration: true,
        moduleId: true,
        order: true,

        module: {
          select: {
            title: true,
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new CustomAppError(404, "Lesson not found");
    }

    return { data: lesson };
  },

  // ============================== ADD LESSON ==============================
  addLesson: async (payload: {
    moduleId: string;
    title: string;
    videoUrl: string;
    duration: number;
  }) => {
    logger.info("Adding lesson", payload);

    // check module exists
    const module = await prisma.module.findUnique({
      where: { id: payload.moduleId },
    });

    if (!module) {
      throw new CustomAppError(
        404,
        "Parent module not found for lesson attachment"
      );
    }

    // get last lesson order
    const lastLesson = await prisma.lesson.findFirst({
      where: { moduleId: payload.moduleId },
      orderBy: { order: "desc" },
    });

    const nextOrder = lastLesson ? lastLesson.order + 1 : 0;

    // create lesson
    const created = await prisma.lesson.create({
      data: {
        title: payload.title,
        videoUrl: payload.videoUrl,
        duration: payload.duration,
        moduleId: payload.moduleId,
        order: nextOrder,
      },
    });

    return { data: created };
  },

  // ============================== UPDATE LESSON ==============================
  updateLesson: async (
    lessonId: string,
    payload: Partial<{
      title: string;
      videoUrl: string;
      duration: number;
    }>
  ) => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new CustomAppError(404, "Lesson not found for update");
    }

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: payload,
    });

    return { data: updated };
  },

  // ============================== DELETE LESSON ==============================
  deleteLesson: async (lessonId: string) => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new CustomAppError(404, "Lesson not found for deletion");
    }

    const deleted = await prisma.lesson.delete({
      where: { id: lessonId },
    });

    return { data: deleted };
  },
};