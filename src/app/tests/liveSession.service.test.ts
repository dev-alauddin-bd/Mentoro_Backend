import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";
import { LiveSession } from "../interfaces/liveSession.interface";
import { liveSessionService } from "../services/liveSession.service";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    liveSession: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    liveRegistration: {
      create: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn()
    }
  }
}));

describe("LiveSession Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerForSession", () => {
    const payload = {
      sessionId: "session1",
      name: "John Doe",
      email: "john@example.com",
      phone: "1234567890",
    };

    it("should create a registration when session exists and deadline not passed", async () => {
      const mockSession = {
        id: "session1",
        title: "Test Session",
        description: "Test description",
        sessionDate: new Date().toISOString(),
        sessionTime: "10:00",
        registrationDeadline: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        isPublished: true,
        // add other required fields if any
      } as any;
      (prisma.liveSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.liveRegistration.create as jest.Mock).mockResolvedValue({ id: "reg1", ...payload });

      const result = await liveSessionService.registerForSession(payload);
      expect(prisma.liveSession.findUnique).toHaveBeenCalledWith({ where: { id: payload.sessionId } });
      expect(prisma.liveRegistration.create).toHaveBeenCalledWith({ data: payload as unknown as any });
      expect(result).toMatchObject({ id: "reg1", ...payload });
    });

    it("should throw CustomAppError 404 when session not found", async () => {
      (prisma.liveSession.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(liveSessionService.registerForSession(payload)).rejects.toThrow(CustomAppError);
      await expect(liveSessionService.registerForSession(payload)).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw CustomAppError 400 when deadline has passed", async () => {
      const pastSession = {
        id: "session1",
        title: "Test Session",
        description: "Test description",
        sessionDate: new Date().toISOString(),
        sessionTime: "10:00",
        registrationDeadline: new Date(Date.now() - 1000 * 60).toISOString(),
        isPublished: true,
      } as any;
      (prisma.liveSession.findUnique as jest.Mock).mockResolvedValue(pastSession);
      await expect(liveSessionService.registerForSession(payload)).rejects.toThrow(CustomAppError);
      await expect(liveSessionService.registerForSession(payload)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("getAllSessions", () => {
    it("should return paginated sessions based on query params", async () => {
      const mockSessions = [{ id: "s1" }, { id: "s2" }];
      (prisma.liveSession.findMany as jest.Mock).mockResolvedValue(mockSessions);
      // Mock total count and registration groupBy
      (prisma.liveSession.count as jest.Mock).mockResolvedValue(2);
      (prisma.liveRegistration.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await liveSessionService.getAllSessions({ page: "2", limit: "5" });

      expect(prisma.liveSession.findMany).toHaveBeenCalledWith({
        where: { isPublished: true },
        orderBy: { sessionDate: 'asc' },
        skip: 5,
        take: 5,
      });
        expect(result).toMatchObject({
          data: mockSessions,
          meta: {
            total: 2,
            page: 2,
            totalPages: 1,
          },
        });
    });

    it("should default to page 1 and limit 10 when params are missing", async () => {
      const mockSessions: LiveSession[] = [];
      (prisma.liveSession.findMany as jest.Mock).mockResolvedValue(mockSessions);
      // Mock total count and registration groupBy for empty result set
      (prisma.liveSession.count as jest.Mock).mockResolvedValue(0);
      (prisma.liveRegistration.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await liveSessionService.getAllSessions();
      expect(prisma.liveSession.findMany).toHaveBeenCalledWith({
        where: { isPublished: true },
        orderBy: { sessionDate: 'asc' },
        skip: 0,
        take: 10,
      });
        expect(result).toMatchObject({
          data: mockSessions,
          meta: {
            total: 0,
            page: 1,
            totalPages: 0,
          },
        });
    });
  });
  });

  describe("getSessionById", () => {
    it("should return session with registration count", async () => {
      const mockSession = { id: "s1", title: "T", description: "D", sessionDate: new Date().toISOString(), sessionTime: "10:00", registrationDeadline: new Date().toISOString(), isPublished: true } as any;
      (prisma.liveSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.liveRegistration.count as jest.Mock).mockResolvedValue(3);
      const result = await liveSessionService.getSessionById("s1");
      expect(prisma.liveSession.findUnique).toHaveBeenCalledWith({ where: { id: "s1" } });
      expect(prisma.liveRegistration.count).toHaveBeenCalledWith({ where: { sessionId: "s1" } });
      expect(result).toMatchObject({ ...mockSession, _count: { registrations: 3 } });
    });

    it("should throw 404 when session not found", async () => {
      (prisma.liveSession.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(liveSessionService.getSessionById("s2")).rejects.toThrow(CustomAppError);
      await expect(liveSessionService.getSessionById("s2")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("createSession", () => {
    it("should create session with combined datetime fields", async () => {
      const payload = {
        title: "New",
        description: "Desc",
        sessionDate: "2023-01-01",
        sessionTime: "12:00",
        registrationDeadlineDate: "2023-01-02",
        registrationDeadlineTime: "13:00",
        isPublished: true,
      } as any;
      const created = { id: "new1", ...payload } as any;
      (prisma.liveSession.create as jest.Mock).mockResolvedValue(created);
      const result = await liveSessionService.createSession(payload);
      expect(prisma.liveSession.create).toHaveBeenCalled();
      expect(result).toBe(created);
    });

    it("should create session with missing time fields to hit fallbacks", async () => {
      const payload = {
        sessionDate: "2023-01-01",
        // missing sessionTime
      } as any;
      (prisma.liveSession.create as jest.Mock).mockResolvedValue({ id: "new2" });
      await liveSessionService.createSession(payload);
      expect(prisma.liveSession.create).toHaveBeenCalled();
    });
  });

  describe("updateSession", () => {
    it("should update session with combined datetime", async () => {
      const existing = { id: "s1" } as any;
      (prisma.liveSession.findUnique as jest.Mock).mockResolvedValue(existing);
      const updatePayload = {
        sessionDate: "2023-02-01",
        sessionTime: "14:00",
        registrationDeadlineDate: "2023-02-02",
        registrationDeadlineTime: "15:00",
        title: "Updated"
      } as any;
      const updated = { id: "s1", ...updatePayload } as any;
      (prisma.liveSession.update as jest.Mock).mockResolvedValue(updated);
      const result = await liveSessionService.updateSession("s1", updatePayload);
      expect(prisma.liveSession.update).toHaveBeenCalled();
      expect(result).toBe(updated);
    });

    it("should hit fallbacks when time is missing in updateSession", async () => {
      const existing = { id: "s1" } as any;
      (prisma.liveSession.findUnique as jest.Mock).mockResolvedValue(existing);
      (prisma.liveSession.update as jest.Mock).mockResolvedValue(existing);
      await liveSessionService.updateSession("s1", { sessionDate: "2023-02-01" });
      expect(prisma.liveSession.update).toHaveBeenCalled();
    });

    it("should throw 404 when session not found for update", async () => {
      (prisma.liveSession.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(liveSessionService.updateSession("missing", {})).rejects.toThrow(CustomAppError);
    });
  });

  describe("deleteSession", () => {
    it("should delete existing session", async () => {
      (prisma.liveSession.findUnique as jest.Mock).mockResolvedValue({ id: "s1" });
      (prisma.liveSession.delete as jest.Mock).mockResolvedValue(undefined);
      const result = await liveSessionService.deleteSession("s1");
      expect(result).toEqual({ message: "Session deleted successfully" });
    });

    it("should throw 404 when session not found", async () => {
      (prisma.liveSession.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(liveSessionService.deleteSession("s2")).rejects.toThrow(CustomAppError);
      await expect(liveSessionService.deleteSession("s2")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("getRegistrantsBySessionId", () => {
    it("should return paginated registrants", async () => {
      const mockRegs = [{ id: "r1" }, { id: "r2" }];
      (prisma.liveRegistration.findMany as jest.Mock).mockResolvedValue(mockRegs);
      (prisma.liveRegistration.count as jest.Mock).mockResolvedValue(2);
      const result = await liveSessionService.getRegistrantsBySessionId("s1", { page: "2", limit: "1" });
      expect(prisma.liveRegistration.findMany).toHaveBeenCalledWith({
        where: { sessionId: "s1" },
        orderBy: { registeredAt: "desc" },
        skip: 1,
        take: 1,
      });
      expect(result).toMatchObject({
        registrants: mockRegs,
        total: 2,
        page: 2,
        totalPages: 2,
      });
    });
  });

  describe("cgetRegistrantsBySessionId", () => {
    it("should return paginated registrants for test alias", async () => {
      const mockRegs = [{ id: "r1" }];
      (prisma.liveRegistration.findMany as jest.Mock).mockResolvedValue(mockRegs);
      (prisma.liveRegistration.count as jest.Mock).mockResolvedValue(1);
      const result = await liveSessionService.cgetRegistrantsBySessionId("s1", {});
      expect(result).toMatchObject({ registrants: mockRegs });
    });
  });

