import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";
import { getQueryObject, IQuery } from "../utils/query";

export const AssignmentService = {
  // ================= CREATE ASSIGNMENT =================
  async createAssignment(payload: {
    moduleId: string;
    description: string;
  }) {
    const module = await prisma.module.findUnique({
      where: { id: payload.moduleId },
    });

    if (!module) {
      throw new CustomAppError(404, "Module not found");
    }

    const existingAssignment = await prisma.assignment.findFirst({
      where: { moduleId: payload.moduleId },
    });

    if (existingAssignment) {
      throw new CustomAppError(400,"This module already contains an assignment");
    }

    return await prisma.assignment.create({
      data: {
        moduleId: payload.moduleId,
        description: payload.description,
      },
    });
  },

  // ================= GET INSTRUCTOR ASSIGNMENTS =================
  async getAssignmentsIntoIntrutorCourses(
    instructorId: string,
    query: IQuery
  ) {
    const q = getQueryObject(query);
    const page = Number(q.page || 1);
    const limit = Number(q.limit || 10);
    const skip = (page - 1) * limit;

    const where = {
      module: {
        course: {
          instructorId, 
        },
      },
    };

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          description: true,
          moduleId: true,
          deadline: true,
          createdAt: true,
          updatedAt: true,
          module: {
            select: {
              title: true,
              course: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),

      prisma.assignment.count({ where }),
    ]);

    return {
      data: assignments,
      meta: { page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  // ================= UPDATE ASSIGNMENT =================
  async updateAssignment(
    id: string,
    payload: Partial<{ description: string }>
  ) {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new CustomAppError(404, "Assignment not found");
    }

    return await prisma.assignment.update({
      where: { id },
      data: {
        ...(payload.description && {
          description: payload.description,
        }),
      },
    });
  },

  // ================= DELETE ASSIGNMENT =================
  async deleteAssignment(id: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new CustomAppError(404, "Assignment not found");
    }

    const deleted = await prisma.assignment.delete({
      where: { id },
    });
    return { data: deleted };
  },

  // ================= SUBMIT ASSIGNMENT =================
  async submitAssignment(
    assignmentId: string,
    studentId: string,
    content: string
  ) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new CustomAppError(404, "Assignment not found");
    }

    return await prisma.assignmentSubmission.upsert({
      where: {
        studentId_assignmentId: {
          studentId,
          assignmentId,
        },
      },
      update: {
        content,
        status: "submitted",
      },
      create: {
        studentId,
        assignmentId,
        content,
      },
    });
  },
};