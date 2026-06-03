import { courseService } from "../services/course.service";
import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    course: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    enrollment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    lessonProgress: {
      upsert: jest.fn(),
    },
  },
}));

describe("COURSE SERVICE FULL COVERAGE", () => {
  beforeEach(() => jest.clearAllMocks());

  // ================= CREATE =================
  it("creates course", async () => {
    (prisma.course.create as jest.Mock).mockResolvedValue({
      id: "1",
      title: "Test",
      price: 100,
    });

    const result = await courseService.createCourse({
      title: "Test",
      price: "100",
    });

    expect(result.id).toBe("1");
  });

  // ================= PUBLIC COURSES =================
  it("getAllPublicCourses basic", async () => {
    (prisma.course.findMany as jest.Mock).mockResolvedValue([
      {
        id: "1",
        title: "Course",
        description: "desc",
        slug: "course",
        thumbnail: "img",
        price: 10,
        _count: { enrollments: 5 },
        category: { name: "dev" },
        instructor: { name: "A", avatar: "img" },
      },
    ]);

    (prisma.course.count as jest.Mock).mockResolvedValue(1);

    const res = await courseService.getAllPublicCourses({});

    expect(res.data.length).toBe(1);
    expect(res.meta.total).toBe(1);
  });

  it("getAllPublicCourses with filters", async () => {
    (prisma.course.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.course.count as jest.Mock).mockResolvedValue(0);

    await courseService.getAllPublicCourses({
      search: "react",
      category: "cat1",
      instructor: "ins1",
      price: "100",
      page: "1",
      limit: "10",
    });

    expect(prisma.course.findMany).toHaveBeenCalled();
  });

  it("getAllPublicCourses missing category and instructor", async () => {
    (prisma.course.findMany as jest.Mock).mockResolvedValue([
      {
        id: "1",
        title: "Course",
        _count: { enrollments: 5 },
        // Intentionally omitting category and instructor to cover fallback branch
      },
    ]);

    (prisma.course.count as jest.Mock).mockResolvedValue(1);

    const res = await courseService.getAllPublicCourses({});

    expect(res.data[0].category).toBeNull();
    expect(res.data[0].instructor).toBeNull();
  });

  // ================= INSTRUCTOR COURSES =================
  it("getAllInstructorCourses", async () => {
    (prisma.course.findMany as jest.Mock).mockResolvedValue([
      {
        id: "1",
        title: "Course",
        description: "desc",
        slug: "c",
        learningOutcomes: [],
        hasCertificate: true,
        previewVideo: null,
        requirements: [],
        targetAudience: [],
        tags: [],
        thumbnail: "img",
        price: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { enrollments: 2 },
        category: { name: "dev" },
        instructor: { name: "A", avatar: "img" },
      },
    ]);

    (prisma.course.count as jest.Mock).mockResolvedValue(1);

    const res = await courseService.getAllInstructorCourses("inst1", {});

    expect(res.data.length).toBe(1);
  });

  it("getAllInstructorCourses missing category and instructor", async () => {
    (prisma.course.findMany as jest.Mock).mockResolvedValue([
      {
        id: "1",
        title: "Course",
        _count: { enrollments: 2 },
        // Intentionally omitting category and instructor
      },
    ]);
    (prisma.course.count as jest.Mock).mockResolvedValue(1);

    const res = await courseService.getAllInstructorCourses("inst1", {});
    expect(res.data[0].category).toBeNull();
    expect(res.data[0].instructor).toBeNull();
  });

  it("getAllInstructorCourses with search query", async () => {
    (prisma.course.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.course.count as jest.Mock).mockResolvedValue(0);

    await courseService.getAllInstructorCourses("inst1", { search: "react" });

    expect(prisma.course.findMany).toHaveBeenCalled();
  });

  // ================= COURSE DETAIL =================
  it("getCourseBySlug success", async () => {
    (prisma.course.findFirst as jest.Mock).mockResolvedValue({
      id: "1",
      title: "Course",
      slug: "course",
      description: "desc",
      thumbnail: "",
      price: 100,
      modules: [
        {
          lessons: [{ duration: 10 }, { duration: 20 }],
        },
      ],
      reviews: [],
      _count: { enrollments: 2 },
      category: { id: "c1", name: "dev" },
      instructor: { id: "i1", name: "A", avatar: "img" },
    });

    const res = await courseService.getCourseBySlug("course");

    expect(res.totalLessons).toBe(2);
    expect(res.totalDuration).toBe(30);
  });

  it("getCourseBySlug success with missing properties", async () => {
    (prisma.course.findFirst as jest.Mock).mockResolvedValue({
      id: "2",
      // Missing modules, category, instructor, learningOutcomes, etc. to hit fallbacks
      modules: [{ lessons: [{}] }], // missing duration
    });

    const res = await courseService.getCourseBySlug("missing");

    expect(res.totalLessons).toBe(1);
    expect(res.totalDuration).toBe(0);
    expect(res.category).toBeNull();
    expect(res.instructor).toBeNull();
    expect(res.learningOutcomes).toEqual([]);
    expect(res.requirements).toEqual([]);
    expect(res.targetAudience).toEqual([]);
    expect(res.tags).toEqual([]);
    expect(res.enrollmentCount).toBe(0);
  });

  it("getCourseBySlug success with null modules array", async () => {
    (prisma.course.findFirst as jest.Mock).mockResolvedValue({
      id: "3",
    });

    const res = await courseService.getCourseBySlug("null-modules");

    expect(res.totalLessons).toBe(0);
    expect(res.totalDuration).toBe(0);
    expect(res.modules).toEqual([]);
  });

  it("getCourseBySlug not found", async () => {
    (prisma.course.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      courseService.getCourseBySlug("wrong")
    ).rejects.toThrow(CustomAppError);
  });

  // ================= ENROLLED COURSES =================
  it("getStudentEnrolledCourses", async () => {
    (prisma.enrollment.findMany as jest.Mock).mockResolvedValue([
      {
        courseId: "c1",
        enrolledAt: new Date(),
        status: "ACTIVE",
        course: {
          title: "Course",
          slug: "c",
          thumbnail: "",
          price: 100,
          instructor: { name: "A", avatar: "" },
          category: { name: "dev" },
          _count: { enrollments: 1 },
          modules: [
            {
              lessons: [
                {
                  id: "l1",
                  progress: [{ isCompleted: true }],
                },
                {
                  id: "l2",
                  progress: [{ isCompleted: false }],
                },
              ],
            },
          ],
        },
      },
    ]);

    const res = await courseService.getStudentEnrolledCourses("stu1");

    expect(res.length).toBe(1);
    expect(res[0].totalLessons).toBe(2);
    expect(res[0].completedLessons).toBe(1);
  });

  it("getStudentEnrolledCourses with zero lessons", async () => {
    (prisma.enrollment.findMany as jest.Mock).mockResolvedValue([
      {
        courseId: "c2",
        enrolledAt: new Date(),
        status: "ACTIVE",
        course: {
          title: "Course",
          slug: "c2",
          thumbnail: "",
          price: 100,
          instructor: { name: "A", avatar: "" },
          category: { name: "dev" },
          _count: { enrollments: 1 },
          modules: [], // No modules -> 0 lessons
        },
      },
    ]);

    const res = await courseService.getStudentEnrolledCourses("stu1");
    expect(res[0].totalLessons).toBe(0);
    expect(res[0].progressPercent).toBe(0);
  });

  // ================= MODULES =================
  it("getStudentEnrolledCourseModules found", async () => {
    (prisma.course.findFirst as jest.Mock).mockResolvedValue({
      id: "c1",
      title: "Course",
      slug: "c",
      modules: [
        {
          lessons: [
            {
              id: "l1",
              progress: [{ isCompleted: true }],
            },
            {
              id: "l2",
              progress: [{ isCompleted: false }],
            },
          ],
        },
      ],
    });

    const res = await courseService.getStudentEnrolledCourseModules(
      "stu1",
      "c1"
    );

    expect(res.totalLessons).toBe(2);
    expect(res.completedLessons).toBe(1);
    expect(res.progressPercent).toBe(50);
  });

  it("getStudentEnrolledCourseModules not found", async () => {
    (prisma.course.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await courseService.getStudentEnrolledCourseModules(
      "stu1",
      "bad"
    );

    expect(res.progressPercent).toBe(0);
  });

  it("getStudentEnrolledCourseModules found with zero lessons", async () => {
    (prisma.course.findFirst as jest.Mock).mockResolvedValue({
      id: "c2",
      title: "Course 2",
      slug: "c2",
      modules: [], // No modules -> 0 lessons
    });

    const res = await courseService.getStudentEnrolledCourseModules(
      "stu1",
      "c2"
    );

    expect(res.totalLessons).toBe(0);
    expect(res.completedLessons).toBe(0);
    expect(res.progressPercent).toBe(0);
  });

  // ================= COMPLETE LESSON =================
  it("completeLesson", async () => {
    (prisma.lessonProgress.upsert as jest.Mock).mockResolvedValue({
      isCompleted: true,
    });

    const res = await courseService.completeLesson("s", "c", "l");

    expect(res.isCompleted).toBe(true);
  });

  // ================= UPDATE / DELETE / TOGGLE =================
  it("updateCourse", async () => {
    (prisma.course.update as jest.Mock).mockResolvedValue({
      id: "1",
    });

    const res = await courseService.updateCourse("1", { title: "new" });

    expect(res.id).toBe("1");
  });

  it("deleteCourse", async () => {
    (prisma.course.update as jest.Mock).mockResolvedValue({
      isDeleted: true,
    });

    const res = await courseService.deleteCourse("1");

    expect(res.isDeleted).toBe(true);
  });

  it("togglePublish success", async () => {
    (prisma.course.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      isPublished: false,
    });

    (prisma.course.update as jest.Mock).mockResolvedValue({
      isPublished: true,
    });

    const res = await courseService.togglePublish("1");

    expect(res.isPublished).toBe(true);
  });

  it("togglePublish error", async () => {
    (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(courseService.togglePublish("x")).rejects.toThrow(
      CustomAppError
    );
  });
});