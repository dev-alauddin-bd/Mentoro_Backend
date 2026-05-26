// ====================
// Module Service (Inline Object)
// ====================

import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";

export const moduleService = {
  // ============================== ADD MODULE ==============================
  addModule: async (courseId: string, moduleData: { title: string }) => {
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      throw new CustomAppError(404, "Course not found");
    }

    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: "desc" }
    });

    const nextOrder = lastModule ? lastModule.order + 1 : 0;

    return prisma.module.create({
      data: {
        title: moduleData.title,
        courseId,
        order: nextOrder
      }
    });
  },

  // ============================== UPDATE MODULE ==============================
  updateModule: async (
    moduleId: string,
    payload: { title?: string }
  ) => {
    const module = await prisma.module.findUnique({
      where: { id: moduleId }
    });

    if (!module) {
      throw new CustomAppError(404, "Module not found");
    }

    return prisma.module.update({
      where: { id: moduleId },
      data: {
        ...(payload.title && { title: payload.title })
      }
    });
  },

  // ============================== DELETE MODULE ==============================
  deleteModule: async (moduleId: string) => {
    const module = await prisma.module.findUnique({
      where: { id: moduleId }
    });

    if (!module) {
      throw new CustomAppError(404, "Module not found");
    }

    const lessonCount = await prisma.lesson.count({
      where: { moduleId }
    });

    if (lessonCount > 0) {
      throw new CustomAppError(
        400,
        "Cannot delete module with lessons"
      );
    }

    return prisma.module.delete({
      where: { id: moduleId }
    });
  },

  // ============================== GET MODULES BY COURSE ==============================
  getModulesByCourseId: async (courseId: string) => {
    const modules = await prisma.module.findMany({
      where: { courseId },
      select: {
        id: true,
        title: true,
        order: true,
        _count: { select: { lessons: true } },
        lessons: {
          select: {
            id: true,
            title: true,
            order: true,
            duration: true
          },
          orderBy: { order: "asc" }
        }
      },
      orderBy: { order: "asc" }
    });

    return { modules };
  },

  // ============================== GET ALL MODULES ==============================
  getAllModules: async (courseId?: string) => {
    return prisma.module.findMany({
      where: {
        ...(courseId && { courseId })
      },
      select: {
        id: true,
        title: true,
        courseId: true,
        order: true,
        isDeleted: true,
        course: {
          select: { title: true }
        },
        _count: {
          select: { lessons: true }
        }
      },
      orderBy: { order: "asc" }
    });
  }
};