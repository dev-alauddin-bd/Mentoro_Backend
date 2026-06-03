// src/app/tests/assignment.service.test.ts
import { AssignmentService } from "../services/assignment.service";
import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    module: { findUnique: jest.fn() },
    assignment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    assignmentSubmission: { upsert: jest.fn() },
  },
}));

describe("Assignment Service", () => {
  beforeEach(() => jest.clearAllMocks());

    describe("createAssignment", () =>  {
    it("creates an assignment when module exists and no duplicate", async () => {
      (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: "mod1" });
      (prisma.assignment.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.assignment.create as jest.Mock).mockResolvedValue({ id: "a1" });

      const result = await AssignmentService.createAssignment({ moduleId: "mod1", description: "test" });
      expect(result).toEqual({ id: "a1" });
    });

    it("throws when module does not exist", async () => {
      (prisma.module.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        AssignmentService.createAssignment({ moduleId: "bad", description: "test" })
      ).rejects.toThrow(CustomAppError);
    });

    it("throws when duplicate assignment exists", async () => {
      (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: "mod1" });
      (prisma.assignment.findFirst as jest.Mock).mockResolvedValue({ id: "a1" });
      await expect(
        AssignmentService.createAssignment({ moduleId: "mod1", description: "test" })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("deleteAssignment", () => {
    it("deletes an existing assignment", async () => {
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({ id: "a1" });
      (prisma.assignment.delete as jest.Mock).mockResolvedValue({ id: "a1" });

      const result = await AssignmentService.deleteAssignment("a1");
      expect(result).toEqual({ data: { id: "a1" } });
    });

    it("throws when assignment not found", async () => {
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(AssignmentService.deleteAssignment("a2")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("submitAssignment", () => {
    it("upserts a submission", async () => {
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({ id: "a1" });
      (prisma.assignmentSubmission.upsert as jest.Mock).mockResolvedValue({ id: "sub1" });

      const result = await AssignmentService.submitAssignment("a1", "stu1", "content");
      expect(result).toEqual({ id: "sub1" });
    });

    it("throws when assignment not found", async () => {
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(AssignmentService.submitAssignment("a2", "stu1", "content")).rejects.toMatchObject({ statusCode: 404 });
    });
  });
    it("creates an assignment when module exists and no duplicate", async () => {
      (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: "mod1" });
      (prisma.assignment.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.assignment.create as jest.Mock).mockResolvedValue({ id: "a1" });

      const result = await AssignmentService.createAssignment({ moduleId: "mod1", description: "test" });
      expect(result).toEqual({ id: "a1" });
    });

    it("throws when module does not exist", async () => {
      (prisma.module.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        AssignmentService.createAssignment({ moduleId: "bad", description: "test" })
      ).rejects.toThrow(CustomAppError);
    });
  });

  describe("getAssignmentsIntoIntrutorCourses", () => {
    it("returns paginated assignments with meta", async () => {
      const mockAssignments = [{ id: "a1" }];
      (prisma.assignment.findMany as jest.Mock).mockResolvedValue(mockAssignments);
      (prisma.assignment.count as jest.Mock).mockResolvedValue(1);

      const result = await AssignmentService.getAssignmentsIntoIntrutorCourses("inst1", { page: "1", limit: "10" });
      expect(result).toMatchObject({ data: mockAssignments, meta: { page: 1, limit: 10, totalPages: 1 } });
    });
  });

  describe("updateAssignment", () => {
    it("updates description when assignment exists", async () => {
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({ id: "a1" });
      (prisma.assignment.update as jest.Mock).mockResolvedValue({ id: "a1", description: "new" });

      const result = await AssignmentService.updateAssignment("a1", { description: "new" });
      expect(result).toEqual({ id: "a1", description: "new" });
    });

    it("throws when assignment not found", async () => {
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        AssignmentService.updateAssignment("a2", { description: "new" })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("deleteAssignment", () => {
    it("deletes an existing assignment", async () => {
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({ id: "a1" });
      (prisma.assignment.delete as jest.Mock).mockResolvedValue({ id: "a1" });

      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({ id: "a1" });
      const result = await AssignmentService.deleteAssignment("a1");
      expect(result).toEqual({ data: { id: "a1" } });
    });
  });

  describe("submitAssignment", () => {
    it("upserts a submission", async () => {
      (prisma.assignment.findUnique as jest.Mock).mockResolvedValue({ id: "a1" });
      (prisma.assignmentSubmission.upsert as jest.Mock).mockResolvedValue({ id: "sub1" });

      const result = await AssignmentService.submitAssignment("a1", "stu1", "content");
      expect(result).toEqual({ id: "sub1" });
    });
  });
