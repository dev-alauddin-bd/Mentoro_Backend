import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";
import logger from "../../lib/logger";

export const lessonService = {

  // ============================== GET ALL LESSONS ==============================
  getAllLessons: async (moduleId?: string) => {
    return prisma.lesson.findMany({
      where: moduleId ? { moduleId } : {},
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
    });
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

    return lesson;
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
    return prisma.lesson.create({
      data: {
        title: payload.title,
        videoUrl: payload.videoUrl,
        duration: payload.duration,
        moduleId: payload.moduleId,
        order: nextOrder,
      },
    });
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

    return prisma.lesson.update({
      where: { id: lessonId },
      data: payload,
    });
  },

  // ============================== DELETE LESSON ==============================
  deleteLesson: async (lessonId: string) => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new CustomAppError(404, "Lesson not found for deletion");
    }

    return prisma.lesson.delete({
      where: { id: lessonId },
    });
  },
};