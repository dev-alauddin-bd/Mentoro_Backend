import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";
import { Role, UserStatus } from "@prisma/client";
import { getQueryObject, IQuery } from "../utils/query";

// ============================== GET ALL USERS ==============================
const getAllUsers = async (
  requester: { id: string; role: Role },
  query: IQuery
) => {
  const q = getQueryObject(query);
  const page = Number(q.page || 1);
  const limit = Number(q.limit || 10);
  const skip = (page - 1) * limit;

  // ================= ROLE BASED ACCESS =================
  const where: any = {};

  if (requester.role === Role.instructor) {
    // instructor can only see students
    where.role = Role.student;
  }

  if (requester.role === Role.student) {
    throw new CustomAppError(403, "You are not allowed to access users");
  }

  // ================= FETCH USERS =================
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.user.count({ where }),
  ]);

  const meta = { page, limit, totalPages: Math.ceil(total / limit) };
  return {
    data: users,
    meta,
  };
};

// ============================== UPDATE USER ROLE ==============================
const updateUserRole = async (userId: string, role: Role) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new CustomAppError(404, "User not found");
  }

  // prevent changing admin accidentally
  if (user.role === Role.admin) {
    throw new CustomAppError(403, "Cannot change admin role");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
};

// ============================== UPDATE USER STATUS ==============================
const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new CustomAppError(404, "User not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
};

// ============================== BECOME INSTRUCTOR ==============================
const becomeInstructor = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new CustomAppError(404, "User not found");
  }

  if (user.role === Role.instructor) {
    throw new CustomAppError(400, "Already an instructor");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: Role.instructor },
  });


  return updatedUser;
};

// ============================== UPDATE PROFILE ==============================
const updateProfile = async (
  userId: string,
  data: { name?: string; avatar?: string }
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new CustomAppError(404, "User not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data,
  });
};

// ============================== EXPORT ==============================
export const userService = {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  becomeInstructor,
  updateProfile,
};