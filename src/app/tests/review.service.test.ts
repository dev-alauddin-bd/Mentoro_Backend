// src/app/tests/review.service.test.ts
import { reviewService } from "../services/review.service";
import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    enrollment: { findFirst: jest.fn() },
    review: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("Review Service", () => {
  beforeEach(() => jest.clearAllMocks());

  // ---------- CREATE REVIEW ----------
  describe("createReview", () => {
    const payload = {
      content: "Great course",
      rating: 5,
      studentId: "stu1",
      courseId: "c1",
    };

    it("creates review when enrolled and no duplicate", async () => {
      (prisma.enrollment.findFirst as jest.Mock).mockResolvedValue({ id: "e1" });
      (prisma.review.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.review.create as jest.Mock).mockResolvedValue({
        id: "r1",
        ...payload,
        createdAt: new Date(),
        students: { name: "Stu", avatar: "a.png", role: "student" },
      });

      const result = await reviewService.createReview(payload);
      expect(result).toMatchObject({ id: "r1", content: "Great course", rating: 5 });
    });

    it("throws when student not enrolled", async () => {
      (prisma.enrollment.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(reviewService.createReview(payload)).rejects.toMatchObject({ statusCode: 403 });
    });

    it("throws when duplicate review exists", async () => {
      (prisma.enrollment.findFirst as jest.Mock).mockResolvedValue({ id: "e1" });
      (prisma.review.findFirst as jest.Mock).mockResolvedValue({ id: "r1" });
      await expect(reviewService.createReview(payload)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ---------- GET ALL REVIEWS ----------
  describe("getAllReviews", () => {
    it("returns paginated reviews with meta", async () => {
      const mockReviews = [{ id: "r1", content: "Nice", rating: 4 }];
      (prisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);
      (prisma.review.count as jest.Mock).mockResolvedValue(1);

      const result = await reviewService.getAllReviews({ page: "1", limit: "10" } as any);
      expect(result).toMatchObject({
        data: mockReviews,
        meta: { page: 1, limit: 10, totalPages: 1 },
      });
    });
  });

  // ---------- DELETE REVIEW ----------
  describe("deleteReview", () => {
    it("throws 404 when review does not exist", async () => {
      (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(reviewService.deleteReview("rev1", "stu1")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("throws 403 when studentId mismatches", async () => {
      (prisma.review.findUnique as jest.Mock).mockResolvedValue({ id: "rev1", studentId: "otherStu" });
      await expect(reviewService.deleteReview("rev1", "stu1")).rejects.toMatchObject({ statusCode: 403 });
    });

    it("deletes review when authorized", async () => {
      (prisma.review.findUnique as jest.Mock).mockResolvedValue({ id: "rev1", studentId: "stu1" });
      (prisma.review.delete as jest.Mock).mockResolvedValue({ id: "rev1" });
      const result = await reviewService.deleteReview("rev1", "stu1");
      expect(result).toEqual({ id: "rev1" });
    });
  });
});
