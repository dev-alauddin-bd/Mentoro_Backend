import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";
import { EnrollmentStatus } from "@prisma/client";
import { getQueryObject, IQuery } from "../utils/query";

export const enrollService = {
  // ================= ENROLL COURSE =================
  enrollCourse: async (studentId: string, slug: string) => {
    const course = await prisma.course.findUnique({
      where: {slug },
    });

    if (!course) throw new CustomAppError(404, "Course not found");

    const user = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!user) throw new CustomAppError(404, "User not found");

    // FREE COURSE → direct ACTIVE
    if (course.price === 0) {
      const enrollment = await prisma.enrollment.upsert({
        where: {
          studentId_courseId: { studentId, courseId: course.id },
        },
        update: {
          status: EnrollmentStatus.ACTIVE,
        },
        create: {
          studentId,
          courseId: course.id,
          status: EnrollmentStatus.ACTIVE,
          email: user.email,
          name: user.name,
          phone: user.phone || "N/A",
          amount: 0,
          currency: "usd",
        },
      });
      return { data: enrollment };
    }

    // PAID COURSE → PENDING ONLY
    const enrollment = await prisma.enrollment.upsert({
      where: {
        studentId_courseId: { studentId, courseId: course.id },
      },
      update: {
        status: EnrollmentStatus.PENDING,
      },
      create: {
        studentId,
        courseId:course.id,
        status: EnrollmentStatus.PENDING,
        email: user.email,
        name: user.name,
        phone: user.phone || "N/A",
        amount: course.price,
        currency: "usd",
      },
    });
    return { data: enrollment };
  },

  // ================= GET MY ENROLLMENTS =================
  getMyEnrollments: async (studentId: string, query: IQuery) => {
    const q = getQueryObject(query);
    const page = Number(q.page || 1);
    const limit = Number(q.limit || 10);
    const skip = (page - 1) * limit;
    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId },
        include: {
          course: true,
        },
        orderBy: { enrolledAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.enrollment.count({
        where: { studentId },
      }),
    ]);
    // include pagination meta
    const meta = { page: page + 1, limit, totalPages: total === 0 ? 0 : Math.ceil(total / limit) + 1 };

    return { data: enrollments, meta };
  },

  // ================= CANCEL ENROLLMENT =================
  cancelEnrollment: async (studentId: string, courseId: string) => {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId },
      },
      include: {
        course: true,
      },
    });

    if (!enrollment) {
      throw new CustomAppError(404, "Enrollment not found");
    }

    // If paid course → force refund via payment service (handled in payment layer)
    if (enrollment.course.price > 0) {
      throw new CustomAppError(
        400,
        "Paid course cannot be cancelled here. Use refund."
      );
    }

    await prisma.enrollment.delete({
      where: {
        studentId_courseId: { studentId, courseId },
      },
    });

    return { data: { message: "Enrollment cancelled successfully" } };
  },
};