// src/app/tests/user.service.test.ts
import { userService } from "../services/user.service";
import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";
import { Role, UserStatus } from "@prisma/client";
// UserRole is no longer needed; using Role enum directly

jest.mock("../../lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("User Service", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getAllUsers", () => {
    it("returns paginated users", async () => {
      const mockUsers = [{ id: "u1" }, { id: "u2" }];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(2);

      const result = await userService.getAllUsers({ id: "admin1", role: Role.admin }, { page: "1", limit: "10" });

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(result).toMatchObject({ data: mockUsers, meta: { page: 1, limit: 10, totalPages: 1 } });
    });

    it("throws when requester is a student", async () => {
      await expect(userService.getAllUsers({ id: "s1", role: Role.student }, {})).rejects.toThrow(CustomAppError);
    });

    it("filters to students when requester is an instructor", async () => {
      const mockUsers = [{ id: "u1" }];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const result = await userService.getAllUsers({ id: "inst1", role: Role.instructor }, {});

      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ role: Role.student })
      }));
      expect(result).toMatchObject({ data: mockUsers, meta: { page: 1, limit: 10, totalPages: 1 } });
    });
  });

  describe("updateUserRole", () => {
    it("updates role for existing non-admin user", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", role: Role.student });
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "u1", role: Role.instructor });

      const result = await userService.updateUserRole("u1", Role.instructor);
      expect(result).toEqual({ id: "u1", role: Role.instructor });
    });

    it("throws when user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(userService.updateUserRole("u2", Role.instructor)).rejects.toThrow(CustomAppError);
    });

    it("throws when trying to change admin role", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "admin", role: Role.admin });
      await expect(userService.updateUserRole("admin", Role.student)).rejects.toThrow(CustomAppError);
    });
  });

  describe("updateUserStatus", () => {
    it("updates status for existing user", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "u3", status: "ACTIVE" });
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "u3", status: "INACTIVE" });

      const result = await userService.updateUserStatus("u3", "INACTIVE" as any);
      expect(result).toEqual({ id: "u3", status: "INACTIVE" });
    });

    it("throws when user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(userService.updateUserStatus("u4", "ACTIVE" as any)).rejects.toThrow(CustomAppError);
    });
  });

  describe("becomeInstructor", () => {
    it("promotes a student to instructor", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "stu1", role: Role.student });
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "stu1", role: Role.instructor });

      const result = await userService.becomeInstructor("stu1");
      expect(result).toEqual({ id: "stu1", role: Role.instructor });
    });

    it("throws when user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(userService.becomeInstructor("missing")).rejects.toThrow(CustomAppError);
    });

    it("throws when already instructor", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "inst1", role: Role.instructor });
      await expect(userService.becomeInstructor("inst1")).rejects.toThrow(CustomAppError);
    });
  });

  describe("updateProfile", () => {
    it("updates name and avatar", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "u5" });
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "u5", name: "New Name", avatar: "avatar.png" });

      const result = await userService.updateProfile("u5", { name: "New Name", avatar: "avatar.png" });
      expect(result).toEqual({ id: "u5", name: "New Name", avatar: "avatar.png" });
    });

    it("throws when user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(userService.updateProfile("u6", { name: "X" })).rejects.toThrow(CustomAppError);
    });
  });

});
