import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";
import { getQueryObject, IQuery } from "../utils/query";

export const reviewService = {
  // ================= CREATE REVIEW =================
  async createReview(payload: {
    content: string;
    rating: number;
    studentId: string;
    courseId: string;
  }) {
    const { studentId, courseId } = payload;

    // check enrollment (must be enrolled)
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
      },
    });

    if (!enrollment) {
      throw new CustomAppError(
        403,
        "You must be enrolled in this course to leave a review."
      );
    }

    // duplicate review check
    const existingReview = await prisma.review.findFirst({
      where: {
        studentId,
        courseId,
      },
    });

    if (existingReview) {
      throw new CustomAppError(
        400,
        "You have already reviewed this course."
      );
    }

    return await prisma.review.create({
      data: {
        content: payload.content,
        rating: payload.rating,
        studentId,
        courseId,
      },
      select: {
        id: true,
        content: true,
        rating: true,
        createdAt: true,
        students: {

          select: {
            name: true,
            avatar: true,
            role: true,
          },


        },
      },
    });
  },

  // ================= GET ALL REVIEWS =================
  async getAllReviews(query: IQuery) {
    const q = getQueryObject(query);
    const page = Number(q.page || 1);
    const limit = Number(q.limit || 10);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          rating: true,
          createdAt: true,
          students: {
            select: {

              name: true,
              avatar: true,
              role: true,
            },

          },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
            },
          },
        },
      }),
      prisma.review.count(),
    ]);

    return {
      data: reviews,
      meta: { page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  // ================= DELETE REVIEW =================
  async deleteReview(id: string, studentId: string) {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new CustomAppError(404, "Review not found");
    }

    if (review.studentId !== studentId) {
      throw new CustomAppError(403, "Unauthorized");
    }

    return await prisma.review.delete({
      where: { id },
    });
  },
};