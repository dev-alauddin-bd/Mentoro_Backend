// src/app/tests/module.service.test.ts
import { moduleService } from "../services/module.service";
import { prisma } from "../../lib/prisma";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    course: { findUnique: jest.fn() },
    module: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    lesson: { count: jest.fn() },
  },
}));

describe("Module Service", () => {
  beforeEach(() => jest.clearAllMocks());

  // ---------- ADD MODULE ----------
  describe("addModule", () => {
    it("creates a module when course exists", async () => {
      (prisma.course.findUnique as jest.Mock).mockResolvedValue({ id: "c1" });
      (prisma.module.findFirst as jest.Mock).mockResolvedValue({ order: 2 });
      (prisma.module.create as jest.Mock).mockResolvedValue({ id: "m1", order: 3 });

      const result = await moduleService.addModule("c1", { title: "New Module" });
      expect(result).toMatchObject({ id: "m1", order: 3 });
    });

    it("throws when course not found", async () => {
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(moduleService.addModule("bad", { title: "X" })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ---------- UPDATE MODULE ----------
  describe("updateModule", () => {
    it("updates title when module exists", async () => {
      (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: "m1" });
      (prisma.module.update as jest.Mock).mockResolvedValue({ id: "m1", title: "Updated" });

      const result = await moduleService.updateModule("m1", { title: "Updated" });
      expect(result).toMatchObject({ id: "m1", title: "Updated" });
    });

    it("throws when module not found", async () => {
      (prisma.module.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(moduleService.updateModule("bad", { title: "X" })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ---------- DELETE MODULE ----------
  describe("deleteModule", () => {
    it("deletes when no lessons attached", async () => {
      (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: "m1" });
      (prisma.lesson.count as jest.Mock).mockResolvedValue(0);
      (prisma.module.delete as jest.Mock).mockResolvedValue({ id: "m1" });

      const result = await moduleService.deleteModule("m1");
      expect(result).toEqual({ id: "m1" });
    });

    it("throws when module not found", async () => {
      (prisma.module.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(moduleService.deleteModule("bad")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("throws when module has lessons", async () => {
      (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: "m1" });
      (prisma.lesson.count as jest.Mock).mockResolvedValue(3);
      await expect(moduleService.deleteModule("m1")).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ---------- GET MODULES BY COURSE ----------
  describe("getModulesByCourseId", () => {
    it("returns paginated modules with meta", async () => {
      const mockModules = [{ id: "m1", title: "A", order: 0 }];
      (prisma.module.findMany as jest.Mock).mockResolvedValue(mockModules);
      (prisma.module.count as jest.Mock).mockResolvedValue(1);

      const result = await moduleService.getModulesByCourseId("c1", { page: "1", limit: "10" } as any);
      expect(result).toMatchObject({ data: mockModules, meta: { page: 1, limit: 10, totalPages: 1 } });
    });
  });

  // ---------- GET ALL MODULES ----------
  describe("getAllModules", () => {
    it("returns all modules (no course filter) with meta", async () => {
      const mockModules = [{ id: "m1", title: "X", courseId: "c1" }];
      (prisma.module.findMany as jest.Mock).mockResolvedValue(mockModules);
      (prisma.module.count as jest.Mock).mockResolvedValue(1);

      const result = await moduleService.getAllModules({ page: "1", limit: "5" } as any);
      expect(result).toMatchObject({ data: mockModules, meta: { page: 1, limit: 5, totalPages: 1 } });
    });

    it("filters by courseId when provided", async () => {
      const mockModules = [{ id: "m2", title: "Y", courseId: "c2" }];
      (prisma.module.findMany as jest.Mock).mockResolvedValue(mockModules);
      (prisma.module.count as jest.Mock).mockResolvedValue(1);

      const result = await moduleService.getAllModules({ page: "1", limit: "5" } as any);
      expect(result).toMatchObject({ data: mockModules, meta: { page: 1, limit: 5, totalPages: 1 } });
    });
  });
});
