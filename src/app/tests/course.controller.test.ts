import { Request, Response } from "express";
import { courseController } from "../controllers/course.controller";
import { courseService } from "../services/course.service";
import { sendResponse } from "../utils/sendResponse";

jest.mock("../services/course.service");
jest.mock("../utils/sendResponse");

// Helper to create mock response object
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res as Response;
};

describe("courseController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCourse", () => {
    it("should call service with body, instructorId and thumbnail and send 201 response", async () => {
      const req = {
        user: { id: "instructor-1" } as any,
        body: { title: "New Course" },
        file: { path: "uploads/img.png" } as any,
      } as Request;
      const res = mockResponse();

      const created = { id: "c1", title: "New Course" } as any;
      (courseService.createCourse as jest.Mock).mockResolvedValue(created);

      await (courseController.createCourse as any)(req, res);

      expect(courseService.createCourse).toHaveBeenCalledWith({
        ...req.body,
        instructorId: "instructor-1",
        thumbnail: "uploads/img.png",
      });
      expect(sendResponse).toHaveBeenCalledWith(res, 201, "Successfully created course", created);
    });
  });

  describe("getAllPublicCourses", () => {
    it("should fetch public courses and return data with meta", async () => {
      const req = { query: {} } as any as Request;
      const res = mockResponse();
      const data = [{ id: "c1" }];
      const meta = { total: 1, page: 1 } as any;
      (courseService.getAllPublicCourses as jest.Mock).mockResolvedValue({ data, meta });

      await (courseController.getAllPublicCourses as any)(req, res);

      expect(courseService.getAllPublicCourses).toHaveBeenCalledWith(req.query);
      expect(sendResponse).toHaveBeenCalledWith(res, 200, "Successfully fetched all public courses", data, meta);
    });
  });

  describe("getAllInstructorCourses", () => {
    it("should fetch courses for instructor", async () => {
      const req = { user: { id: "inst-1" } as any, query: {} } as any as Request;
      const res = mockResponse();
      const data = [{ id: "c2" }];
      const meta = { total: 1, page: 1 } as any;
      (courseService.getAllInstructorCourses as jest.Mock).mockResolvedValue({ data, meta });

      await (courseController.getAllInstructorCourses as any)(req, res);

      expect(courseService.getAllInstructorCourses).toHaveBeenCalledWith("inst-1", req.query);
      expect(sendResponse).toHaveBeenCalledWith(res, 200, "Successfully fetched all instructor courses", data, meta);
    });
  });

  describe("getCourseBySlug", () => {
    it("should fetch a single course by slug", async () => {
      const req = { params: { slug: "my-course" } } as any as Request;
      const res = mockResponse();
      const result = { id: "c3", slug: "my-course" } as any;
      (courseService.getCourseBySlug as jest.Mock).mockResolvedValue(result);

      await (courseController.getCourseBySlug as any)(req, res);

      expect(courseService.getCourseBySlug).toHaveBeenCalledWith("my-course");
      expect(sendResponse).toHaveBeenCalledWith(res, 200, "Successfully fetched course by slug", result);
    });
  });

  describe("getStudentEnrolledCourses", () => {
    it("should fetch enrolled courses for a student", async () => {
      const req = { user: { id: "student-1" } as any } as any as Request;
      const res = mockResponse();
      const result = [{ id: "c4" }];
      (courseService.getStudentEnrolledCourses as jest.Mock).mockResolvedValue(result);

      await (courseController.getStudentEnrolledCourses as any)(req, res);

      expect(courseService.getStudentEnrolledCourses).toHaveBeenCalledWith("student-1");
      expect(sendResponse).toHaveBeenCalledWith(res, 200, "Successfully fetched student enrolled courses", result);
    });
  });

  describe("getStudentEnrolledCourseModules", () => {
    it("should fetch modules for a student and course", async () => {
      const req = {
        user: { id: "student-2" } as any,
        params: { courseId: "c5" },
      } as any as Request;
      const res = mockResponse();
      const result = { modules: [] } as any;
      (courseService.getStudentEnrolledCourseModules as jest.Mock).mockResolvedValue(result);

      await (courseController.getStudentEnrolledCourseModules as any)(req, res);

      expect(courseService.getStudentEnrolledCourseModules).toHaveBeenCalledWith("student-2", "c5");
      expect(sendResponse).toHaveBeenCalledWith(res, 200, "Successfully fetched student enrolled course modules", result);
    });
  });

  describe("completeLesson", () => {
    it("should call service and respond with 200", async () => {
      const req = {
        user: { id: "stud-1" } as any,
        body: { courseId: "c6", lessonId: "l1" },
      } as any as Request;
      const res = mockResponse();

      await (courseController.completeLesson as any)(req, res);

      expect(courseService.completeLesson).toHaveBeenCalledWith("stud-1", "c6", "l1");
      expect(sendResponse).toHaveBeenCalledWith(res, 200, "Successfully completed lesson");
    });
  });

  describe("updateCourse", () => {
    it("should update and return result", async () => {
      const req = {
        params: { id: "c7" },
        body: { title: "Updated" },
      } as any as Request;
      const res = mockResponse();
      const result = { id: "c7", title: "Updated" } as any;
      (courseService.updateCourse as jest.Mock).mockResolvedValue(result);

      await (courseController.updateCourse as any)(req, res);

      expect(courseService.updateCourse).toHaveBeenCalledWith("c7", req.body);
      expect(sendResponse).toHaveBeenCalledWith(res, 200, "Successfully updated course", result);
    });
  });

  describe("deleteCourse", () => {
    it("should delete and respond", async () => {
      const req = { params: { id: "c8" } } as any as Request;
      const res = mockResponse();
      const result = { message: "deleted" } as any;
      (courseService.deleteCourse as jest.Mock).mockResolvedValue(result);

      await (courseController.deleteCourse as any)(req, res);

      expect(courseService.deleteCourse).toHaveBeenCalledWith("c8");
      expect(sendResponse).toHaveBeenCalledWith(res, 200, "Successfully deleted course", result);
    });
  });

  describe("togglePublish", () => {
    it("should toggle and respond", async () => {
      const req = { params: { id: "c9" } } as any as Request;
      const res = mockResponse();
      const result = { published: true } as any;
      (courseService.togglePublish as jest.Mock).mockResolvedValue(result);

      await (courseController.togglePublish as any)(req, res);

      expect(courseService.togglePublish).toHaveBeenCalledWith("c9");
      expect(sendResponse).toHaveBeenCalledWith(res, 200, "Successfully toggled publish", result);
    });
  });
});
