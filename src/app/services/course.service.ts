import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { createSlug } from "../utils/generateSlug";
import { CustomAppError } from "../errors/customError";
import { getQueryObject, IQuery } from "../utils/query";
import { Course } from "@prisma/client";


const clearCourseCaches = async () => {
  try {
    const keys = await redisClient.keys("public_courses:*");
    const instructorKeys = await redisClient.keys("instructor_courses:*");
    const courseKeys = await redisClient.keys("course:*");

    const allKeys = [...keys, ...instructorKeys, ...courseKeys];

    if (allKeys.length > 0) {
      await redisClient.del(...allKeys);
    }
  } catch (err) {
    console.error("Cache clear failed:", err);
  }
};

/* ================= SERVICE ================= */

export const courseService = {

  /* ================= CREATE ================= */
  async createCourse(payload: any) {
    const course = await prisma.course.create({
      data: {
        ...payload,
        slug: createSlug(payload.title),
        price: Number(payload.price),
      },
    });

    // Clear all public course caches
   clearCourseCaches();
    return course;
  },

  /* ================= GET ALL PUBLIC COURSES ================= */
  async getAllPublicCourses(query: IQuery) {
    const q = getQueryObject(query);

    const cacheKey = `public_courses:${JSON.stringify(q)}`;

    // 1. Check Redis
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const page = Number(q.page || 1);
    const limit = Number(q.limit || 10);
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
      isPublished: true,
    };

    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: "insensitive" } },
        { description: { contains: q.search, mode: "insensitive" } },
      ];
    }

    if (q.category) where.categoryId = q.category;
    if (q.instructor) where.instructorId = q.instructor;
    if (q.price) where.price = { lte: Number(q.price) };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          thumbnail: true,
          price: true,

          _count: {
            select: {
              enrollments: true,
            },
          },

          category: {
            select: {
              name: true,
            },
          },

          instructor: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
      }),

      prisma.course.count({ where }),
    ]);

    const formattedCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      slug: course.slug,
      thumbnail: course.thumbnail,
      price: course.price,
      enrollments: course._count.enrollments,
      category: course.category?.name ?? null,
      instructor: course.instructor?.name ?? null,
      instructorAvatar: course.instructor?.avatar ?? null,
    }));

    const result = {
      data: formattedCourses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // 2. Save Redis (10 minutes)
    await redisClient.set(
      cacheKey,
      JSON.stringify(result),
      "EX",
      600
    );

    return result;
  },

  // ================== GET ALL INSTRUCTOR COURSES ==================
  async getAllInstructorCourses(instructorId: string, query: IQuery) {
    const q = getQueryObject(query);

    const cacheKey = `instructor_courses:${instructorId}:${JSON.stringify(q)}`;

    // 1. Check Redis
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const page = Number(q.page || 1);
    const limit = Number(q.limit || 10);
    const skip = (page - 1) * limit;

    const where: any = {
      instructorId,
      isDeleted: false,
    };

    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: "insensitive" } },
        { description: { contains: q.search, mode: "insensitive" } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          learningOutcomes: true,
          hasCertificate: true,
          previewVideo: true,
          requirements: true,
          targetAudience: true,
          tags: true,
          thumbnail: true,
          price: true,
          createdAt: true,
          updatedAt: true,

          _count: {
            select: {
              enrollments: true,
            },
          },

          category: {
            select: {
              name: true,
            },
          },

          instructor: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
      }),

      prisma.course.count({ where }),
    ]);

    const formattedCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      slug: course.slug,
      thumbnail: course.thumbnail,
      price: course.price,
      enrollments: course._count.enrollments,
      category: course.category?.name ?? null,
      instructor: course.instructor?.name ?? null,
      instructorAvatar: course.instructor?.avatar ?? null,
      previewVideo: course.previewVideo,
      learningOutcomes: course.learningOutcomes,
      hasCertificate: course.hasCertificate,
      requirements: course.requirements,
      targetAudience: course.targetAudience,
      tags: course.tags,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));

    const result = {
      data: formattedCourses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // 2. Save to Redis (10 min)
    await redisClient.set(
      cacheKey,
      JSON.stringify(result),
      "EX",
      60 * 60
    );

    return result;
  },
  /* ================= COURSE DETAIL ================= */
  /* ================= COURSE DETAIL ================= */
  async getCourseBySlug(slug: string) {
    const course = await prisma.course.findFirst({
      where: {
        slug,
        isDeleted: false,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        price: true,

        learningOutcomes: true,
        requirements: true,
        targetAudience: true,
        tags: true,

        previewVideo: true,
        hasCertificate: true,

        modules: {
          select: {
            id: true,
            title: true,
            lessons: {
              select: {
                id: true,
                title: true,
                duration: true,
              },
            },
          },
        },

        reviews: {
          select: {
            id: true,
            rating: true,
            content: true,
            students: {
              select: {
                name: true,
              },
            },
          },
        },

        _count: {
          select: {
            enrollments: true,
          },
        },

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
      },
    });

    if (!course) throw new CustomAppError(404, "Course not found");

    // ================= TOTALS (BACKEND HANDLE) =================
    const totalLessons =
      course.modules?.reduce(
        (acc, m) => acc + (m.lessons?.length || 0),
        0
      ) || 0;

    const totalDuration =
      course.modules?.reduce(
        (acc, m) =>
          acc +
          (m.lessons?.reduce(
            (lAcc, l) => lAcc + (l.duration || 0),
            0
          ) || 0),
        0
      ) || 0;

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnail: course.thumbnail,
      price: course.price,

      enrollmentCount: course._count?.enrollments ?? 0,

      category: course.category ?? null,
      instructor: course.instructor ?? null,

      previewVideo: course.previewVideo,

      learningOutcomes: course.learningOutcomes ?? [],
      requirements: course.requirements ?? [],
      targetAudience: course.targetAudience ?? [],
      tags: course.tags ?? [],

      modules: course.modules ?? [],
      reviews: course.reviews ?? [],

      hasCertificate: course.hasCertificate ?? false,

      // ✅ computed backend fields
      totalLessons,
      totalDuration,
    };
  }
  ,
  // ==================== MY ENROLLED COURSES LIGHT FAST CLEAN RESPONSE ====================


  async getStudentEnrolledCourses(studentId: string) {
    const courses = await prisma.enrollment.findMany({
      where: {
        studentId,
        course: {
          isPublished: true,
          isDeleted: false,
        },
      },

      select: {
        id: true,
        courseId: true,

        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,

            instructor: {
              select: {
                name: true,
                avatar: true,
              },
            },

            category: {
              select: {
                name: true,
              },
            },

            _count: {
              select: {
                enrollments: true,
              },
            },

            modules: {
              where: {
                isDeleted: false,
              },
              orderBy: {
                order: "asc",
              },
              select: {
                id: true,
                title: true,

                lessons: {
                  where: {
                    isDeleted: false,
                  },
                  orderBy: {
                    order: "asc",
                  },
                  select: {
                    id: true,
                    title: true,
                    duration: true,
                    videoUrl: true,

                    // ✅ FIX: progress tracking (REAL LMS WAY)
                    progress: {
                      where: {
                        studentId,
                      },
                      select: {
                        isCompleted: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },

        enrolledAt: true,
        status: true,
      },
    });

    // ===================== FORMATTING =====================

    const formattedCourses = courses.map((enroll) => {
      const modules = enroll.course.modules;

      const totalLessons = modules.reduce(
        (sum, mod) => sum + mod.lessons.length,
        0
      );

      const completedLessons = modules.reduce((sum, mod) => {
        return (
          sum +
          mod.lessons.filter(
            (l: any) => l.progress?.[0]?.isCompleted === true
          ).length
        );
      }, 0);

      return {
        id: enroll.courseId,
        title: enroll.course.title,
        slug: enroll.course.slug,
        thumbnail: enroll.course.thumbnail,
        price: enroll.course.price,

        instructor: enroll.course.instructor,
        category: enroll.course.category,

        enrolledAt: enroll.enrolledAt,
        status: enroll.status,

        totalLessons,
        completedLessons,

        // optional (VERY USEFUL FOR UI)
        progressPercent:
          totalLessons === 0
            ? 0
            : Math.round((completedLessons / totalLessons) * 100),
      };
    });



    return formattedCourses;
  },
  /* ================= COURSE MODULES + PROGRESS (FIXED CORE) ================= */
  async getStudentEnrolledCourseModules(
    studentId: string,
    courseIdOrSlug: string
  ) {

    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }],
        enrollments: {
          some: { studentId },
        },
      },

      select: {
        id: true,
        title: true,
        slug: true,

        modules: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            title: true,

            lessons: {
              where: {
                isDeleted: false,
              },
              select: {
                id: true,
                title: true,
                duration: true,
                videoUrl: true,

                progress: {
                  where: {
                    studentId,
                  },
                  select: {
                    isCompleted: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // ================= SAFETY CHECK =================
    if (!course) {
      return {
        modules: [],
        totalLessons: 0,
        completedLessons: 0,
        progressPercent: 0,
      };
    }

    // ================= SINGLE SOURCE OF TRUTH =================
    let totalLessons = 0;
    let completedLessons = 0;

    const modules = course.modules.map((module) => {
      const lessons = module.lessons.map((lesson) => {
        const isCompleted = lesson.progress?.[0]?.isCompleted || false;

        totalLessons += 1;
        if (isCompleted) completedLessons += 1;

        return {
          id: lesson.id,
          title: lesson.title,
          duration: lesson.duration,
          videoUrl: lesson.videoUrl,
          isCompleted,
        };
      });

      return {
        id: module.id,
        title: module.title,
        lessons,
      };
    });

    const progressPercent =
      totalLessons === 0
        ? 0
        : Math.round((completedLessons / totalLessons) * 100);

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,

      modules,

      totalLessons,
      completedLessons,
      progressPercent,
    };
  },
  /* ================= COMPLETE LESSON (FIXED) ================= */
  async completeLesson(studentId: string, courseId: string, lessonId: string) {
    return prisma.lessonProgress.upsert({
      where: {
        studentId_lessonId: { studentId, lessonId },
      },
      create: {
        studentId,
        courseId,
        lessonId,
        isCompleted: true,
      },
      update: {
        isCompleted: true,
      },
    });
  },

  // ============================== UPDATE COURSE ==============================
  async updateCourse(courseId: string, data: Partial<Course>) {
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data,
    });

    clearCourseCaches();

    return updatedCourse;
  },

  // ============================== DELETE COURSE ==============================
  async deleteCourse(courseId: string) {
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { isDeleted: true },
    });

    clearCourseCaches();

    return updatedCourse;
  },
  // ============================== TOGGLE PUBLISH ==============================
  async togglePublish(courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) throw new CustomAppError(404, "Course not found");

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { isPublished: !course.isPublished },
    });

   clearCourseCaches();

    return updatedCourse;
  }
};