// ====================
//   Live Session Service

import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";
import { Prisma } from "@prisma/client";
import { getQueryObject, IQuery } from "../utils/query";

export const liveSessionService = {
  // ============================== REGISTER For Session ==============================
  registerForSession: async (payload: { sessionId: string; name: string; email: string; phone: string }) => {
    const session = await prisma.liveSession.findUnique({ where: { id: payload.sessionId } });
    if (!session) {
      throw new CustomAppError(404, "Session not found");
    }
    // Check deadline
    if (new Date() > new Date(session.registrationDeadline)) {
      throw new CustomAppError(400, "Registration deadline has passed");
    }
    return await prisma.liveRegistration.create({
      data: payload as unknown as Prisma.LiveRegistrationCreateInput,
    });
  },

  // ============================== GET ALL Sessions ==============================
  getAllSessions: async (query: IQuery = {}) => {
    const q = getQueryObject(query);
    const page = Number(q.page || 1);
    const limit = Number(q.limit || 10);
    const skip = (page - 1) * limit;
    const where = { isPublished: true };

    const [sessions, total] = await Promise.all([
      prisma.liveSession.findMany({
        where,
        orderBy: { sessionDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.liveSession.count({ where }),
    ]);

    const sessionIds = sessions.map((s) => s.id);
    const registrationCounts = await prisma.liveRegistration.groupBy({
      by: ["sessionId"],
      where: { sessionId: { in: sessionIds } },
      _count: { sessionId: true },
    });
    const countMap = new Map(registrationCounts.map((rc) => [rc.sessionId, rc._count.sessionId]));
    const sessionsWithCount = sessions.map((session) => ({
      ...session,
      _count: { registrations: countMap.get(session.id) || 0 },
    }));

    const meta = {
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };

    return { data: sessionsWithCount, meta };

  },

  // ============================== GET Session By ID ==============================
  getSessionById: async (id: string) => {
    const session = await prisma.liveSession.findUnique({ where: { id } });
    if (!session) {
      throw new CustomAppError(404, "Session not found");
    }
    const registrationsCount = await prisma.liveRegistration.count({ where: { sessionId: id } });
    return { ...session, _count: { registrations: registrationsCount } };
  },

  // ============================== UPDATE Session ==============================
  updateSession: async (id: string, payload: Record<string, any>) => {
    const sessionDateTime = payload.sessionDate && payload.sessionTime ? new Date(`${payload.sessionDate}T${payload.sessionTime}`).toISOString() : undefined;
    const registrationDeadlineDateTime = payload.registrationDeadlineDate && payload.registrationDeadlineTime ? new Date(`${payload.registrationDeadlineDate}T${payload.registrationDeadlineTime}`).toISOString() : undefined;
    const data: any = {
      ...payload,
      sessionDate: sessionDateTime ?? payload.sessionDate,
      registrationDeadline: registrationDeadlineDateTime ?? payload.registrationDeadlineDate,
      // Remove raw split fields
      sessionTime: undefined,
      registrationDeadlineTime: undefined,
      registrationDeadlineDate: undefined,
    };
    const session = await prisma.liveSession.findUnique({ where: { id } });
    if (!session) throw new CustomAppError(404, "Session not found for update");
    return await prisma.liveSession.update({ where: { id }, data: data as unknown as Prisma.LiveSessionUpdateInput });
  },

  // ============================== DELETE Session ==============================
  deleteSession: async (id: string) => {
    const session = await prisma.liveSession.findUnique({ where: { id } });
    if (!session) throw new CustomAppError(404, "Session not found for deletion");
    await prisma.liveSession.delete({ where: { id } });
    return { message: "Session deleted successfully" };
  },

  // ============================== GET Registrants ==============================
  getRegistrantsBySessionId: async (sessionId: string, query: IQuery = {}) => {
    const q = getQueryObject(query);
    const page = Number(q.page || 1);
    const limit = Number(q.limit || 10);
    const skip = (page - 1) * limit;
    const where = { sessionId };
    const [registrants, total] = await Promise.all([
      prisma.liveRegistration.findMany({ where, orderBy: { registeredAt: "desc" }, skip, take: limit }),
      prisma.liveRegistration.count({ where }),
    ]);
    return { registrants, total, page, totalPages: Math.ceil(total / limit) };
  },
  // New function to create a session with combined date and time fields
  createSession: async (payload: any) => {
    // Combine date and time into ISO strings if provided
    const sessionDateTime = payload.sessionDate && payload.sessionTime ? `${payload.sessionDate}T${payload.sessionTime}` : undefined;
    const registrationDeadlineDateTime = payload.registrationDeadlineDate && payload.registrationDeadlineTime ? `${payload.registrationDeadlineDate}T${payload.registrationDeadlineTime}` : undefined;
    const data: any = {
      ...payload,
      sessionDate: sessionDateTime ?? payload.sessionDate,
      registrationDeadline: registrationDeadlineDateTime ?? payload.registrationDeadlineDate,
      // Remove raw split fields
      sessionTime: undefined,
      registrationDeadlineTime: undefined,
      registrationDeadlineDate: undefined,
    };
    return await prisma.liveSession.create({ data: data as unknown as Prisma.LiveSessionCreateInput });
  },

  // Alias for test compatibility
  cgetRegistrantsBySessionId: async (sessionId: string, query: IQuery = {}) => {
    const result = await liveSessionService.getRegistrantsBySessionId(sessionId, query);
    // Return shape expected by tests
    return {
      registrants: result.registrants,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  },
};
