//  ====================
//     Enroll Service
// ====================

import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";
import { paymentService } from "./payment.service";

// ============================== ENROLL In Course ==============================
const enrollCourse = async (studentId: string, courseId: string) => {
  const course = await prisma.course.findFirst({
    where: {
      OR: [
        { id: courseId },
        { slug: courseId }
      ]
    }
  });

  if (!course) {
    throw new CustomAppError(404, "Course not found");
  }

  if (course.price > 0) {
    throw new CustomAppError(400, "This is a paid course. Please proceed to payment checkout.");
  }

  return await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId, courseId: course.id } },
    update: {},
    create: { studentId, courseId: course.id },
  });
};

// ============================== GET My Enrollments ==============================
const getMyEnrollments = async (studentId: string, query: Record<string, unknown> = {}) => {
  const page = Number(query.page as string) || 1;
  const limit = Number(query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId },
      select: {
        id: true,
        enrolledAt: true,
        lastActivity: true,
        courseId: true,
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            price: true,
            instructor: { select: { name: true } }
          }
        }
      },
      orderBy: { enrolledAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.enrollment.count({ where: { studentId } })
  ]);

  return {
    enrollments,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

// ============================== GET Enrolled Content ==============================
const getEnrolledCourseContent = async (studentId: string, courseId: string) => {
  // Check if course exists
  const course = await prisma.course.findFirst({
    where: {
      OR: [
        { id: courseId },
        { slug: courseId }
      ]
    },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnail: true,
      price: true,
      instructorId: true,
      category: { select: { id: true, name: true } },
      modules: {
        select: {
          id: true,
          title: true,
          order: true,
          assignments: {
            select: { id: true, description: true }
          },
          lessons: {
            select: {
              id: true,
              title: true,
              videoUrl: true,
              duration: true,
              order: true,
              completedByUsers: {
                where: { studentId },
                select: { id: true }
              }
            },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!course) {
    throw new CustomAppError(404, "Course not found");
  }

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: course.id } }
  });

  if (!enrollment) {
    throw new CustomAppError(403, "Access denied: You are not enrolled in this course");
  }

  // Linear progression logic
  let isNextLessonLocked = false;
  const processedModules = course.modules.map(mod => {
    const processedLessons = mod.lessons.map(les => {
      const isCompleted = les.completedByUsers.length > 0;
      const isUnlocked = !isNextLessonLocked;

      // Lock subsequent lessons if this one is not completed
      if (!isCompleted) {
        isNextLessonLocked = true;
      }

      return {
        id: les.id,
        title: les.title,
        videoUrl: les.videoUrl,
        duration: les.duration,
        order: les.order,
        isCompleted,
        isUnlocked
      };
    });

    const lessonCount = processedLessons.length;
    const completedCount = processedLessons.filter(l => l.isCompleted).length;

    return {
      id: mod.id,
      title: mod.title,
      order: mod.order,
      lessonCount,
      completedCount,
      progressPercentage: lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0,
      assignments: mod.assignments,
      lessons: processedLessons
    };
  });

  return {
    ...course,
    modules: processedModules
  };
};

export const enrollService = {
  enrollCourse,
  getMyEnrollments,
  getEnrolledCourseContent,
  cancelEnrollment: async (studentId: string, courseId: string) => {
    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { id: courseId },
          { slug: courseId }
        ]
      }
    });

    if (!course) {
      throw new CustomAppError(404, "Course not found");
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: course.id } },
      include: { course: true }
    });

    if (!enrollment) {
      throw new CustomAppError(404, "Enrollment not found");
    }

    // If it's a paid course, we handle it through the payment service (refund)
    if (enrollment.course.price > 0) {

      return await paymentService.refundCourse(studentId, course.id);
    }

    // If it's a free course, just delete the enrollment
    await prisma.enrollment.delete({
      where: { studentId_courseId: { studentId, courseId: course.id } }
    });

    return { message: "Unenrolled from free course successfully" };
  }
};
