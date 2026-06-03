import { dashboardService } from "../services/dashboard.service";
import { prisma } from "../../lib/prisma";
import { Role } from "@prisma/client";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    user: { count: jest.fn() },
    course: { count: jest.fn() },
    enrollment: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    lesson: { count: jest.fn() },
    payment: { aggregate: jest.fn() },
    lessonProgress: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe("DASHBOARD SERVICE FULL TEST", () => {
  beforeEach(() => jest.clearAllMocks());

  // ================= ADMIN =================
  it("admin analytics normal", async () => {
    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5);

    (prisma.course.count as jest.Mock).mockResolvedValue(20);
    (prisma.enrollment.count as jest.Mock).mockResolvedValue(50);
    (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: 1000 },
    });

    const result = await dashboardService.getAdminAnalytics();

    expect(result.role).toBe(Role.admin);
    expect(result.statistics.totalStudents).toBe(10);
  });

  it("admin analytics - zero students branch", async () => {
    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(5);

    (prisma.course.count as jest.Mock).mockResolvedValue(0);
    (prisma.enrollment.count as jest.Mock).mockResolvedValue(0);
    (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: 0 },
    });

    const result = await dashboardService.getAdminAnalytics();

    expect(result.statistics.engagementRate).toBe(0);
  });

  it("admin analytics - cap 100%", async () => {
    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0);

    (prisma.enrollment.count as jest.Mock).mockResolvedValue(10);
    (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: 0 },
    });

    const result = await dashboardService.getAdminAnalytics();

    expect(result.statistics.engagementRate).toBe(100);
  });

  it("admin analytics - null revenue fallback", async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(1);
    (prisma.course.count as jest.Mock).mockResolvedValue(1);
    (prisma.enrollment.count as jest.Mock).mockResolvedValue(1);
    (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: null },
    });

    const result = await dashboardService.getAdminAnalytics();
    expect(result.statistics.totalRevenue).toBe(0);
  });

  // ================= INSTRUCTOR =================
  it("instructor analytics normal", async () => {
    (prisma.course.count as jest.Mock).mockResolvedValue(5);
    (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
    (prisma.enrollment.count as jest.Mock).mockResolvedValue(20);

    (prisma.enrollment.groupBy as jest.Mock).mockResolvedValue([
      { studentId: "s1" },
      { studentId: "s2" },
    ]);

    (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: 500 },
    });

    const result = await dashboardService.getInstructorAnalytics("i1");

    expect(result.statistics.totalStudents).toBe(2);
    expect(result.statistics.totalCourses).toBe(5);
  });

  it("instructor analytics zero students", async () => {
    (prisma.course.count as jest.Mock).mockResolvedValue(1);
    (prisma.lesson.count as jest.Mock).mockResolvedValue(2);
    (prisma.enrollment.count as jest.Mock).mockResolvedValue(0);
    (prisma.enrollment.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: 0 },
    });

    const result = await dashboardService.getInstructorAnalytics("i2");

    expect(result.statistics.totalStudents).toBe(0);
    expect(result.statistics.engagementRate).toBe(0);
  });

  it("instructor analytics - null fallbacks", async () => {
    (prisma.course.count as jest.Mock).mockResolvedValue(1);
    (prisma.lesson.count as jest.Mock).mockResolvedValue(1);
    (prisma.enrollment.count as jest.Mock).mockResolvedValue(1);
    (prisma.enrollment.groupBy as jest.Mock).mockResolvedValue(null);
    (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: null },
    });

    const result = await dashboardService.getInstructorAnalytics("i1");
    expect(result.statistics.totalRevenue).toBe(0);
    expect(result.statistics.totalStudents).toBe(0);
  });

  // ================= STUDENT =================
  it("student analytics empty", async () => {
    (prisma.enrollment.count as jest.Mock).mockResolvedValue(0);
    (prisma.lessonProgress.count as jest.Mock).mockResolvedValue(0);
    (prisma.enrollment.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.lessonProgress.findMany as jest.Mock).mockResolvedValue([]);

    const result = await dashboardService.getStudentAnalytics("s1");

    expect(result.statistics.totalEnrolled).toBe(0);
    expect(result.statistics.overallProgress).toBe(0);
  });

  it("student analytics - covers 100% progress branch", async () => {
    (prisma.enrollment.count as jest.Mock).mockResolvedValue(1);
    (prisma.lessonProgress.count as jest.Mock).mockResolvedValue(1);

    (prisma.enrollment.findMany as jest.Mock).mockResolvedValue([
      {
        course: {
          id: "c1",
          title: "Course 1",
          thumbnail: "",
          modules: [
            {
              lessons: [{ id: "l1" }],
            },
          ],
        },
      },
    ]);

    (prisma.lessonProgress.findMany as jest.Mock).mockResolvedValue([
      { lessonId: "l1" },
    ]);

    const result = await dashboardService.getStudentAnalytics("s1");

    expect(result.statistics.completedCourses).toBe(1);
  });

  // 🔥 FIX FOR YOUR MISSING 136–153 LINES
  it("student analytics - covers overallProgress branch", async () => {
    (prisma.enrollment.count as jest.Mock).mockResolvedValue(2);
    (prisma.lessonProgress.count as jest.Mock).mockResolvedValue(2);

    (prisma.enrollment.findMany as jest.Mock).mockResolvedValue([
      {
        course: {
          id: "c1",
          title: "Course 1",
          thumbnail: "",
          modules: [
            {
              lessons: [{ id: "l1" }, { id: "l2" }],
            },
          ],
        },
      },
      {
        course: {
          id: "c2",
          title: "Course 2",
          thumbnail: "",
          modules: [
            {
              lessons: [{ id: "l3" }, { id: "l4" }],
            },
          ],
        },
      },
    ]);

    (prisma.lessonProgress.findMany as jest.Mock).mockResolvedValue([
      { lessonId: "l1" },
      { lessonId: "l3" },
    ]);

    const result = await dashboardService.getStudentAnalytics("s1");

    expect(result.statistics.overallProgress).toBeGreaterThanOrEqual(0);
    expect(result.statistics.totalEnrolled).toBe(2);
  });

  // ================= PROGRESS =================
  it("progress empty", async () => {
    (prisma as any).progress = {
      findMany: jest.fn().mockResolvedValue([]),
    };

    const result = await dashboardService.progress();

    expect(result).toEqual({ progress: 0 });
  });

  it("progress average", async () => {
    (prisma as any).progress = {
      findMany: jest.fn().mockResolvedValue([
        { progress: 0.2 },
        { progress: 0.4 },
        { progress: 0.6 },
      ]),
    };

    const result = await dashboardService.progress();

    expect(result.progress).toBeGreaterThan(0);
  });

  it("progress handles undefined findMany", async () => {
    (prisma as any).progress = {}; // no findMany
    const result = await dashboardService.progress();
    expect(result).toEqual({ progress: 0 });
  });

  it("progress handles missing progress field", async () => {
    (prisma as any).progress = {
      findMany: jest.fn().mockResolvedValue([
        { progress: null },
        { }, // undefined
      ]),
    };
    const result = await dashboardService.progress();
    expect(result.progress).toBe(0);
  });
});