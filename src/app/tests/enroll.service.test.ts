import { enrollService } from "../services/enroll.service";
import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";
import { EnrollmentStatus } from "@prisma/client";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    course: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    enrollment: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("Enroll Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should enroll free course directly as ACTIVE", async () => {
    const studentId = "s1";
    const courseId = "c1";
    const enrollId = "e1";
    (prisma.course.findUnique as jest.Mock).mockResolvedValue({ id: courseId, price: 0 });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: studentId, email: "test@example.com", name: "Test", phone: "123" });
    (prisma.enrollment.upsert as jest.Mock).mockResolvedValue({ status: EnrollmentStatus.ACTIVE });
    const result = await enrollService.enrollCourse(studentId, courseId);
    expect(result.data.status).toBe(EnrollmentStatus.ACTIVE);
    expect(prisma.enrollment.upsert).toHaveBeenCalled();
  });

  it("should enroll paid course as PENDING", async () => {
    const studentId = "s2";
    const courseId = "c2";
    (prisma.course.findUnique as jest.Mock).mockResolvedValue({ id: courseId, price: 100 });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: studentId, email: "test@example.com", name: "Test", phone: "123" });
    (prisma.enrollment.upsert as jest.Mock).mockResolvedValue({ status: EnrollmentStatus.PENDING });
    const result = await enrollService.enrollCourse(studentId, courseId);
    expect(result.data.status).toBe(EnrollmentStatus.PENDING);
  });

  it("should get paginated enrollments", async () => {
    const studentId = "s1";
    const query = { page: 1, limit: 10 };
    const dummyEnroll = [{ id: "e1" }];
    (prisma.enrollment.findMany as jest.Mock).mockResolvedValue(dummyEnroll);
    (prisma.enrollment.count as jest.Mock).mockResolvedValue(12);
    const result = await enrollService.getMyEnrollments(studentId, query);
    expect(result.data).toBe(dummyEnroll);
    expect(result.meta.page).toBe(2);
    expect(result.meta.totalPages).toBe(3);
  });

  it("should throw when cancelling paid enrollment", async () => {
    const studentId = "s1";
    const courseId = "c1";
    (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue({
      course: { price: 50 },
    });
    await expect(enrollService.cancelEnrollment(studentId, courseId)).rejects.toThrow(CustomAppError);
  });
  it("should throw if course not found", async () => {
    const studentId = "s1";
    const courseId = "c1";
    (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(enrollService.enrollCourse(studentId, courseId)).rejects.toThrow(CustomAppError);
  });

  it("should throw if user not found", async () => {
    const studentId = "s1";
    const courseId = "c1";
    (prisma.course.findUnique as jest.Mock).mockResolvedValue({ id: courseId, price: 0 });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(enrollService.enrollCourse(studentId, courseId)).rejects.toThrow(CustomAppError);
  });

  it("should handle empty enrollments list", async () => {
    const studentId = "s1";
    const query = { page: 1, limit: 10 };
    (prisma.enrollment.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.enrollment.count as jest.Mock).mockResolvedValue(0);
    const result = await enrollService.getMyEnrollments(studentId, query);
    expect(result.data).toEqual([]);
    expect(result.meta.totalPages).toBe(0);
  });


  it("should cancel free enrollment successfully", async () => {
    const studentId = "s1";
    const courseId = "c1";
    (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue({
      course: { price: 0 },
    });
    (prisma.enrollment.delete as jest.Mock).mockResolvedValue({});
    const result = await enrollService.cancelEnrollment(studentId, courseId);
    expect(result.data.message).toBe("Enrollment cancelled successfully");
    expect(prisma.enrollment.delete).toHaveBeenCalled();
  });

  it("should throw when enrollment not found", async () => {
    const studentId = "s1";
    const courseId = "c1";
    (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(enrollService.cancelEnrollment(studentId, courseId)).rejects.toThrow(CustomAppError);
  });
});

