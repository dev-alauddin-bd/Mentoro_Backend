import { Prisma } from "@prisma/client";
import { CustomAppError } from "../errors/customError";
import { prisma } from "../../lib/prisma";

export const jobService = {

  // ============================== CREATE JOB ==============================
  createJob: async (data: Record<string, unknown>) => {
    return prisma.job.create({
      data: data as unknown as Prisma.JobCreateInput,
    });
  },

  // ============================== GET ALL JOBS ==============================
  getAllJobs: async (query: Record<string, unknown>) => {
    const page = Number(query.page as string) || 1;
    const limit = Number(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { search, category, type } = query;

    const where: Prisma.JobWhereInput = {
      isPublished: true,

      // search filter
      ...(search && {
        OR: [
          {
            title: {
              contains: search as string,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: search as string,
              mode: "insensitive",
            },
          },
        ],
      }),

      // category filter
      ...(category && { category: category as string }),

      // type filter
      ...(type && { type: type as string }),
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  // ============================== GET SINGLE JOB ==============================
  getJobById: async (id: string) => {
    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        category: true,
        location: true,
        type: true,
        salary: true,
        description: true,
        deadline: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,

        applications: {
          select: {
            id: true,
            fullName: true,
            email: true,
            resumeLink: true,
            coverLetter: true,
            status: true,
            appliedAt: true,
          },
        },
      },
    });

    if (!job) {
      throw new CustomAppError(404, "Job not found");
    }

    return job;
  },

  // ============================== UPDATE JOB ==============================
  updateJob: async (id: string, data: Record<string, unknown>) => {
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new CustomAppError(404, "Job not found for update");
    }

    return prisma.job.update({
      where: { id },
      data: data as unknown as Prisma.JobUpdateInput,
    });
  },

  // ============================== DELETE JOB ==============================
  deleteJob: async (id: string) => {
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new CustomAppError(404, "Job not found for deletion");
    }

    return prisma.job.delete({
      where: { id },
    });
  },

  // ============================== APPLY FOR JOB ==============================
  applyForJob: async (data: Record<string, unknown>) => {
    return prisma.jobApplication.create({
      data: data as unknown as Prisma.JobApplicationCreateInput,
    });
  },

  // ============================== GET ALL APPLICATIONS ==============================
  getAllApplications: async (query: Record<string, unknown>) => {
    const page = Number(query.page as string) || 1;
    const limit = Number(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        select: {
          id: true,
          fullName: true,
          email: true,
          resumeLink: true,
          coverLetter: true,
          status: true,
          appliedAt: true,

          job: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
        orderBy: { appliedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.jobApplication.count(),
    ]);

    return {
      applications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },
};