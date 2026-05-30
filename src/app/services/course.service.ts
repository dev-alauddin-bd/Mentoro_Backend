import { ICourse, IUpdateCourse } from "../interfaces/course.interface";
import { CustomAppError } from "../errors/customError";
import { prisma } from "../../lib/prisma";
import redis from "../../lib/redis";
import logger from "../../lib/logger";
import { Prisma } from "@prisma/client";
import { createSlug } from "../utils/generateSlug";

// ================= CACHE CLEAR =================
const clearCourseCache = async () => {
  try {
    const keys = await redis.keys("courses_v2:*");

    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`🧹 Cleared ${keys.length} course cache keys`);
    }
  } catch (err) {
    logger.error("Cache clear error", err);
  }
};

// ================= COURSE SERVICE =================
export const courseService = {
  // ================= CREATE COURSE =================
  async createCourse(payload: ICourse) {
    const slug = createSlug(payload.title);
    const course = await prisma.course.create({
      data: {
        title: payload.title,
        description: payload.description,
        categoryId: payload.categoryId,
        slug,
        instructorId: payload.instructorId,
        previewVideo: payload.previewVideo,
        thumbnail: payload.thumbnail,
        price: Number(payload.price),
        hasCertificate: payload.hasCertificate,
        learningOutcomes: payload.learningOutcomes,
        requirements: payload.requirements,
        targetAudience: payload.targetAudience,
        tags: payload.tags,
      },
    });
    console.log('course', course)
    await clearCourseCache();
    return course;
  },

  // ================= GET ALL PUBLIC COURSES =================
  async getAllPublicCourses(query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      isDeleted: false,
      isPublished: true
    };


    // search
    if (query.search) {
      where.OR = [
        {
          title: {
            contains: String(query.search),
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: String(query.search),
            mode: "insensitive",
          },
        },
      ];
    }

    // category
    if (query.category) {
      where.categoryId = query.category as string;
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          previewVideo: true,
          price: true,
          slug: true,
          hasCertificate: true,
          createdAt: true,

          category: {
            select: {
              id: true,
              name: true,
            },
          },

          instructor: {
            select: {
              id: true,
              name: true,
              avatar: true,

            },
          },

          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      }),

      prisma.course.count({ where }),
    ]);

    return {
      courses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },


  // ================= GET ALL INSTRUCTOR COURSES =================
  async getAllInstructorCourses(instructorId: string, query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      isDeleted: false,
      instructorId,
    };


    // search
    if (query.search) {
      where.OR = [
        {
          title: {
            contains: String(query.search),
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: String(query.search),
            mode: "insensitive",
          },
        },
      ];
    }

    // category
    if (query.category) {
      where.categoryId = query.category as string;
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          previewVideo: true,
          price: true,
          hasCertificate: true,
          createdAt: true,
          slug: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },

          instructor: {
            select: {
              id: true,
              name: true,
              avatar: true,

            },
          },

          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      }),

      prisma.course.count({ where }),
    ]);

    return {
      courses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },
  // ================= GET COURSE BY ID =================
  async getCourseBySlug(slug: string) {
    const course = await prisma.course.findUnique({
      where: { slug, isDeleted: false },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        previewVideo: true,
        price: true,

        hasCertificate: true,

        learningOutcomes: true,
        requirements: true,
        targetAudience: true,
        tags: true,

        createdAt: true,
        updatedAt: true,

        category: {
          select: {
            id: true,
            name: true,
          },
        },

        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,

          },
        },

        modules: {
          select: {
            id: true,
            title: true,
            order: true,
            lessons: {
              select: {
                id: true,
                title: true,
                videoUrl: true,
                duration: true,
                order: true,
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },

        reviews: {
          select: {
            id: true,
            content: true,
            rating: true,
            createdAt: true,
            students: {
              select: {
                name: true,
                avatar: true,
              },

            },
          },
          orderBy: { createdAt: "desc" },
        },

        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new CustomAppError(404, "Course not found");
    }

    return {
      ...course,
    };
  },

  // ================= MY COURSES =================
  async getMyCourses(studentId: string, query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          studentId
        },
        skip,
        take: limit,
        orderBy: { lastActivity: "desc" },
        include: {
          course: {
            include: {
              instructor: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              },
            },
          },
        },
      }),

      prisma.enrollment.count({
        where: {
          studentId,
        },
      }),
    ]);

    return {
      enrollments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  // ================= COMPLETE LESSON =================
  async completeLesson(studentId: string, courseId: string, lessonId: string) {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
      },
    });

    if (!enrollment) {
      throw new CustomAppError(403, "Not enrolled in this course");
    }

    await prisma.completedLesson.upsert({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId,
        },
      },
      create: {
        studentId,
        lessonId,
      },
      update: {},
    });

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { lastActivity: new Date() },
    });
  },

  // ================= UPDATE COURSE =================
  async updateCourse(id: string, payload: Partial<IUpdateCourse>) {

    console.log("payload", payload)
    const existing = await prisma.course.findFirst({ where: { OR: [{ id }, { slug: id }] } });

    if (!existing) {
      throw new CustomAppError(404, "Course not found");
    }

    const updated = await prisma.course.update({
      where: { id: existing.id },
      data: payload,
    });

    await clearCourseCache();
    return updated;
  },

  // ================= DELETE COURSE =================
  async deleteCourse(id: string, user: any) {
    const existing = await prisma.course.findFirst({ where: { OR: [{ id }, { slug: id }] } });

    if (!existing) {
      throw new CustomAppError(404, "Course not found");
    }

    if (
      user.role !== "admin" &&
      existing.instructorId !== user.id
    ) {
      throw new CustomAppError(403, "Not authorizationd");
    }

    await prisma.course.update({
      where: { id: existing.id },
      data: {
        isDeleted: true,
        isPublished: false,
      },
    });

    await clearCourseCache();

    return { message: "Course deleted successfully" };
  },

  // ================= TOGGLE PUBLISH =================
  async togglePublish(id: string) {
    const existing = await prisma.course.findFirst({ where: { OR: [{ id }, { slug: id }] } });

    if (!existing) {
      throw new CustomAppError(404, "Course not found");
    }

    const updated = await prisma.course.update({
      where: { id: existing.id },
      data: {
        isPublished: !existing.isPublished,
      },
    });

    await clearCourseCache();
    return updated;
  },
};