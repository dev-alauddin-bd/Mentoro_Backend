import { prisma } from "../../lib/prisma";
import { Role } from "@prisma/client";

// ============================== DASHBOARD SERVICE ==============================
export const dashboardService = {
  // ============================== ADMIN ANALYTICS ==============================
  async getAdminAnalytics() {
    const [totalStudents, totalInstructors, totalCourses, totalEnrollments, revenueData] =
      await Promise.all([
        prisma.user.count({ where: { role: Role.student } }),
        prisma.user.count({ where: { role: Role.instructor } }),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.payment.aggregate({
          where: { status: "COMPLETED" },
          _sum: { amount: true },
        }),
      ]);

    const totalRevenue = revenueData._sum.amount ?? 0;

    const engagementRate =
      totalStudents > 0
        ? Math.min(Math.round((totalEnrollments / totalStudents) * 100), 100)
        : 0;

    return {
      role: Role.admin,
      statistics: {
        totalStudents,
        totalInstructors,
        totalCourses,
        totalEnrollments,
        totalRevenue,
        engagementRate,
      },
      message: "Admin dashboard data generated",
    };
  },

  // ============================== INSTRUCTOR ANALYTICS ==============================
  async getInstructorAnalytics(userId: string) {
    const [totalCourses, totalLessons, totalEnrollments, studentGroups, revenueData] =
      await Promise.all([
        prisma.course.count({
          where: { instructorId: userId },
        }),

        prisma.lesson.count({
          where: { module: { course: { instructorId: userId } } },
        }),

        prisma.enrollment.count({
          where: { course: { instructorId: userId } },
        }),

        prisma.enrollment.groupBy({
          by: ["studentId"],
          where: { course: { instructorId: userId } },
        }),

        prisma.payment.aggregate({
          where: {
            status: "COMPLETED",
            course: { instructorId: userId },
          },
          _sum: { amount: true },
        }),
      ]);

    const totalStudents = studentGroups.length;
    const totalRevenue = revenueData._sum.amount ?? 0;

    const engagementRate =
      totalStudents > 0
        ? Math.min(Math.round((totalEnrollments / totalStudents) * 100), 100)
        : 0;

    return {
      role: Role.instructor,
      statistics: {
        totalCourses,
        totalStudents,
        totalEnrollments,
        totalLessons,
        totalRevenue,
        engagementRate,
      },
      message: "Instructor dashboard data generated",
    };
  },

  // ============================== STUDENT ANALYTICS ==============================
  async getStudentAnalytics(userId: string) {
    const [enrolledCount, completedLessonsCount, enrollments] = await Promise.all([
      prisma.enrollment.count({
        where: { studentId: userId },
      }),

      prisma.completedLesson.count({
        where: { studentId: userId },
      }),

      prisma.enrollment.findMany({
        where: { studentId: userId },
        select: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              modules: {
                select: {
                  lessons: {
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const completedLessons = await prisma.completedLesson.findMany({
      where: { studentId: userId },
      select: { lessonId: true },
    });

    const completedSet = new Set(completedLessons.map((l) => l.lessonId));

    let completedCourses = 0;
    let progressSum = 0;

    const enrichedCourses = enrollments.map((enrollment) => {
      const lessons = enrollment.course.modules.flatMap((m) => m.lessons);
      const totalLessons = lessons.length;

      let progress = 0;

      if (totalLessons > 0) {
        const completed = lessons.filter((l) =>
          completedSet.has(l.id)
        ).length;

        progress = Math.round((completed / totalLessons) * 100);

        if (progress === 100) {
          completedCourses++;
        }
      }

      progressSum += progress;

      return {
        ...enrollment.course,
        progress,
      };
    });

    const inProgress = enrolledCount - completedCourses;

    const overallProgress =
      enrolledCount > 0 ? Math.round(progressSum / enrolledCount) : 0;

    return {
      role: Role.student,
      statistics: {
        totalEnrolled: enrolledCount,
        completedCourses,
        inProgress,
        overallProgress,
        lessonsCompleted: completedLessonsCount,
        continueCourses: enrichedCourses.slice(0, 4),
      },
      message: "Student dashboard data generated",
    };
  },
};