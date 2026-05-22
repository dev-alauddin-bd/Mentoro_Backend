//  ====================
//      Course Service
// ====================

import { ICourse } from "../interfaces/course.interface";
import { CustomAppError } from "../errors/customError";
import { prisma } from "../../lib/prisma";
import redis from "../../lib/redis";
import logger from "../../lib/logger";
import { Prisma } from "@prisma/client";

// ============================== HELPER: Clear Course Cache ==============================
const clearCourseCache = async () => {
  try {
    const keys = await redis.keys("courses:*");
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`🧹 Cleared ${keys.length} course cache keys`);
    }
  } catch (error) {
    logger.error("❌ Error clearing course cache:", error);
  }
};

// ============================== CREATE Course ==============================
const createCourse = async (payload: ICourse) => {
  try {
    console.log("Incoming Payload:", payload);

    const {
      title,
      description,
      categoryId,
      instructorId,
      previewVideo,
      price,
      thumbnail,
    } = payload;

    console.log({
      title,
      description,
      categoryId,
      instructorId,
      previewVideo,
      price,
      thumbnail,
    });

    if (
      !title ||
      !categoryId ||
      !instructorId ||
      !previewVideo ||
      !thumbnail
    ) {
      throw new Error("Required fields missing");
    }

    const result = await prisma.course.create({
      data: {
        title,
        description,
        categoryId,
        instructorId,
        previewVideo,
        price: Number(price) || 0,
        thumbnail,
      },
    });

    await clearCourseCache();

    return result;
  } catch (error) {
    console.error(error);

    logger.error(JSON.stringify(error, null, 2));

    throw new CustomAppError(500, "Course creation failed");
  }
};

// ============================== GET ALL Courses ==============================
const getAllCourses = async (query: Record<string, unknown>) => {
  const page = Number(query.page as string) || 1;
  const limit = Number(query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Check cache first
  const cacheKey = `courses:${page}:${limit}:${query.search as string}:${query.category as string}:${query.sort as string}`;
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const where: Record<string, unknown> = {};

  // Filter By Publish Status
  if (query.instructorId && query.instructorId !== 'undefined') {
    where.instructorId = query.instructorId as string;
  } else if (query.showAll === 'true') {
    // Admin or specific view: show everything
  } else {
    // Public view: only show published
    where.isPublished = true;
  }

  // Optimized Search
  if (query.search) {
    where.OR = [
      { title: { contains: query.search as string, mode: "insensitive" } },
      { description: { contains: query.search as string, mode: "insensitive" } },
    ];
  }

  // Category Filter
  if (query.category) {
    where.categoryId = query.category as string;
  }

  // Featured Filter
  if (query.isFeatured === "true") {
    where.isFeatured = true;
  }

  // Feature Requested Filter
  if (query.featureRequested === "true") {
    where.featureRequested = true;
  }

  // Sort Logic

  // Sort Logic
  let orderBy: Record<string, unknown> = { createdAt: "desc" };
  if (query.sort) {
    if (query.sort === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (query.sort === "popular") {
      orderBy = { enrolledUsers: { _count: "desc" } };
    } else {
      const [field, order] = (query.sort as string).split(":");
      const allowedFields = ["price", "createdAt", "title"];
      if (allowedFields.includes(field) && order) {
        orderBy = { [field]: order === "desc" ? "desc" : "asc" };
      }
    }
  }

  // Database Query (Optimized Select)
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where: where as Prisma.CourseWhereInput,
      orderBy: orderBy as Prisma.CourseOrderByWithRelationInput,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        price: true,
        thumbnail: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        instructor: { select: { name: true, avatar: true } },
        _count: { select: { enrolledUsers: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  const result = {
    courses,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };

  // Cache result (Wait for cache to be set before returning)
  redis.setex(cacheKey, 300, JSON.stringify(result)).catch(err => logger.error("Redis Cache Error:", err));

  return result;
};


// ============================== GET Course By ID ==============================
const getCourseById = async (id: string, userId?: string) => {
  const course = await prisma.course.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnail: true,
      previewVideo: true,
      price: true,
      instructorId: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { id: true, name: true } },
      instructor: { select: { name: true, avatar: true } },
      modules: {
        select: {
          id: true,
          title: true,
          order: true,
          assignments: {
            select: { id: true, description: true, deadline: true }
          },
          lessons: {
            select: { id: true, title: true, videoUrl: true, duration: true, order: true },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      },
      _count: { select: { enrolledUsers: true } },
      reviews: {
        select: {
          id: true,
          content: true,
          rating: true,
          createdAt: true,
          user: { select: { name: true, avatar: true } }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!course) {
    throw new CustomAppError(404, "Course not found in our records");
  }

  let isEnrolled = false;
  if (userId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: id } }
    });
    isEnrolled = !!enrollment;
  }

  return { ...course, isEnrolled };
};

// ============================== UPDATE Course ==============================
const updateCourse = async (id: string, payload: Partial<ICourse>) => {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    throw new CustomAppError(404, "Unable to update: Course not found");
  }

  const result = await prisma.course.update({
    where: { id },
    data: payload as unknown as Prisma.CourseUpdateInput,
    select: {
      id: true,
      title: true,
      description: true,
      thumbnail: true,
      price: true,
      isPublished: true,
      category: { select: { id: true, name: true } }
    }
  });

  await clearCourseCache();
  return result;

};

// ============================== TOGGLE Publish Status ==============================
const togglePublish = async (id: string) => {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    throw new CustomAppError(404, "Unable to toggle: Course not found");
  }

  const result = await prisma.course.update({
    where: { id },
    data: { isPublished: !existing.isPublished },
  });

  await clearCourseCache();
  return result;

};

// ============================== DELETE Course ==============================
const deleteCourse = async (id: string) => {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    throw new CustomAppError(404, "Unable to delete: Course not found");
  }

  await prisma.course.delete({ where: { id } });
  await clearCourseCache();
  return { message: "Course has been successfully deleted from the server" };
};

// ============================== MARK Lesson Completed ==============================
const completeLesson = async (userId: string, courseId: string, lessonId: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } }
  });

  if (!enrollment) {
    throw new CustomAppError(403, "Access denied: You are not enrolled in this course");
  }

  await prisma.completedLesson.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId },
    update: {}
  });

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { lastActivity: new Date() }
  });
};

// ============================== GET My Enrolled Courses ==============================
const getMyCourses = async (userId: string, query: Record<string, unknown> = {}) => {
  const page = Number(query.page as string) || 1;
  const limit = Number(query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId },
      select: {
        id: true,
        enrolledAt: true,
        lastActivity: true,
        courseId: true,
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            price: true,
            instructorId: true,
            categoryId: true,
            isPublished: true,
            instructor: { select: { name: true, avatar: true } },
            modules: {
              select: {
                id: true,
                lessons: {
                  select: {
                    id: true,
                    completedByUsers: {
                      where: { userId },
                      select: { id: true }
                    }
                  }
                },
              },
            },
          },
        },
      },
      orderBy: { lastActivity: "desc" },
      skip,
      take: limit,
    }),
    prisma.enrollment.count({ where: { userId } })
  ]);

  const courses = enrollments.map((enrollment) => {
    let totalLessons = 0;
    let completedLessonsCount = 0;

    enrollment.course.modules?.forEach((mod) => {
      totalLessons += mod.lessons?.length || 0;
      mod.lessons?.forEach((lesson) => {
        if (lesson.completedByUsers && lesson.completedByUsers.length > 0) {
          completedLessonsCount++;
        }
      });
    });

    const progressPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

    return {
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.enrolledAt,
      lastActivity: enrollment.lastActivity,
      id: enrollment.course.id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      thumbnail: enrollment.course.thumbnail,
      price: enrollment.course.price,
      instructorId: enrollment.course.instructorId,
      instructor: enrollment.course.instructor,
      isPublished: enrollment.course.isPublished,
      categoryId: enrollment.course.categoryId,
      totalModules: enrollment.course.modules?.length || 0,
      totalLessons,
      completedLessonsCount,
      progressPercentage,
    };
  });

  return {
    courses,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

// ============================== GET Recommendations ==============================
const getRecommendations = async (userId: string) => {
  try {
    const userEnrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { course: { select: { category: { select: { name: true } } } } },
    });

    const categories = userEnrollments.map((e) => e.course.category?.name).filter(Boolean);

    return await prisma.course.findMany({
      where: {
        category: { name: { in: categories as string[] } },
        enrolledUsers: { none: { userId } }
      },
      take: 3,
      select: {
        id: true,
        title: true,
        thumbnail: true,
        price: true,
        category: { select: { id: true, name: true } },
        instructor: { select: { name: true, avatar: true } }
      }
    });
  } catch (error) {
    logger.error("Recommendation Error:", error);
    throw error;
  }
};

// ============================== REQUEST Feature ==============================
const requestFeature = async (id: string, instructorId: string) => {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new CustomAppError(404, "Course not found");
  if (course.instructorId !== instructorId) throw new CustomAppError(403, "You can only request features for your own courses");

  const result = await prisma.course.update({
    where: { id },
    data: { featureRequested: true },
  });

  await clearCourseCache();
  return result;

};

// ============================== APPROVE Feature ==============================
const approveFeature = async (id: string, isFeatured: boolean) => {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new CustomAppError(404, "Course not found");

  const result = await prisma.course.update({
    where: { id },
    data: {
      isFeatured,
      featureRequested: false // Reset request status after admin action
    },
  });

  await clearCourseCache();
  return result;

};

export const courseService = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getMyCourses,
  completeLesson,
  togglePublish,
  getRecommendations,
  requestFeature,
  approveFeature
};
