//  ====================
//   Live Session Service
// ====================

import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";
import { Prisma } from "@prisma/client";
import { LiveSession } from "../interfaces/liveSession.interface";

// ============================== REGISTER For Session ==============================
const registerForSession = async (payload: { sessionId: string; name: string; email: string; phone: string }) => {
  const session = await prisma.liveSession.findUnique({
    where: { id: payload.sessionId }
  });

  if (!session) {
    throw new CustomAppError(404, "Session not found");
  }

  // Check deadline
  if (new Date() > new Date(session.registrationDeadline)) {
    throw new CustomAppError(400, "Registration deadline has passed");
  }

  return await prisma.liveRegistration.create({
    data: payload as unknown as Prisma.LiveRegistrationCreateInput
  });
};

// ============================== GET ALL Sessions ==============================
const getAllSessions = async (query: Record<string, unknown> = {}) => {
  const page = Number(query.page as string) || 1;
  const limit = Number(query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const where = { isPublished: true };

  const [sessions, total] = await Promise.all([
    prisma.liveSession.findMany({
      where,
      orderBy: { sessionDate: 'asc' },
      skip,
      take: limit,
    }),
    prisma.liveSession.count({ where })
  ]);

  const sessionIds = sessions.map(s => s.id);
  const registrationCounts = await prisma.liveRegistration.groupBy({
    by: ['sessionId'],
    where: { sessionId: { in: sessionIds } },
    _count: { sessionId: true }
  });

  const countMap = new Map(registrationCounts.map(rc => [rc.sessionId, rc._count.sessionId]));

  const sessionsWithCount = sessions.map(session => ({
    ...session,
    _count: { registrations: countMap.get(session.id) || 0 }
  }));

  return {
    sessions: sessionsWithCount,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

// ============================== GET Session By ID ==============================
const getSessionById = async (id: string) => {
  const session = await prisma.liveSession.findUnique({
    where: { id },
  });

  if (!session) {
    throw new CustomAppError(404, "Session not found");
  }

  const registrationsCount = await prisma.liveRegistration.count({
    where: { sessionId: id }
  });

  return {
    ...session,
    _count: { registrations: registrationsCount }
  };
};

// ============================== CREATE Session ==============================
const createSession = async (payload: LiveSession) => {
  const {
    sessionDate,
    sessionTime,
    registrationDeadlineDate,
    registrationDeadlineTime,
    ...rest
  } = payload;

  // Combine date and time fields if both parts are provided
  const sessionDateTime = sessionDate && sessionTime ? new Date(`${sessionDate}T${sessionTime}`).toISOString() : undefined;
  const registrationDeadlineDateTime = registrationDeadlineDate && registrationDeadlineTime ? new Date(`${registrationDeadlineDate}T${registrationDeadlineTime}`).toISOString() : undefined;

  const data: any = {
    ...rest,
    // Prefer combined datetime; if not provided, fall back to date-only values
    sessionDate: sessionDateTime ?? (sessionDate ? new Date(sessionDate).toISOString() : undefined),
    registrationDeadline: registrationDeadlineDateTime ?? (registrationDeadlineDate ? new Date(registrationDeadlineDate).toISOString() : undefined),
  };

  const newSession = await prisma.liveSession.create({
    data,
  });

  return newSession;
};

// ============================== UPDATE Session ==============================
const updateSession = async (id: string, payload: Record<string, any>) => {
  // Combine date and time fields into ISO strings for Prisma if provided
  const sessionDateTime = payload.sessionDate && payload.sessionTime
    ? new Date(`${payload.sessionDate}T${payload.sessionTime}`).toISOString()
    : undefined;
  const registrationDeadlineDateTime = payload.registrationDeadlineDate && payload.registrationDeadlineTime
    ? new Date(`${payload.registrationDeadlineDate}T${payload.registrationDeadlineTime}`).toISOString()
    : undefined;

  // Build the data object, overriding with combined fields and removing split parts
  const data: any = {
    ...payload,
    sessionDate: sessionDateTime ?? payload.sessionDate,
    registrationDeadline: registrationDeadlineDateTime ?? payload.registrationDeadlineDate,
    // Remove raw split fields to avoid unexpected columns
    sessionTime: undefined,
    registrationDeadlineTime: undefined,
    registrationDeadlineDate: undefined,
  };

  const session = await prisma.liveSession.findUnique({ where: { id } });
  if (!session) throw new CustomAppError(404, "Session not found for update");

  return await prisma.liveSession.update({
    where: { id },
    data: data as unknown as Prisma.LiveSessionUpdateInput,
  });
};

// ============================== DELETE Session ==============================
const deleteSession = async (id: string) => {
  const session = await prisma.liveSession.findUnique({ where: { id } });
  if (!session) throw new CustomAppError(404, "Session not found for deletion");

  await prisma.liveSession.delete({
    where: { id }
  });
  return { message: "Session deleted successfully" };
};

// ============================== GET Registrants ==============================
const getRegistrantsBySessionId = async (sessionId: string, query: Record<string, unknown> = {}) => {
  const page = Number(query.page as string) || 1;
  const limit = Number(query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const where = { sessionId };

  const [registrants, total] = await Promise.all([
    prisma.liveRegistration.findMany({
      where,
      orderBy: { registeredAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.liveRegistration.count({ where })
  ]);

  return {
    registrants,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const liveSessionService = {
  registerForSession,
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getRegistrantsBySessionId
};
