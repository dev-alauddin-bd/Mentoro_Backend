import { prisma } from "../../lib/prisma";
import { CustomAppError } from "../errors/customError";

export const categoryService = {

  // ============================== GET ALL CATEGORIES ==============================
  getAllCategories: async (query: Record<string, unknown> = {}) => {
    const page = Number(query.page as string) || 1;
    const limit = Number(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { courses: true } },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.category.count(),
    ]);

    return {
      categories,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  // ============================== CREATE CATEGORY ==============================
  createCategory: async (data: { name: string }) => {
    // check duplicate category
    const existing = await prisma.category.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new CustomAppError(400, "Category already exists");
    }

    // create category
    return prisma.category.create({
      data: {
        name: data.name,
        isActive: true,
      },
    });
  },

  // ============================== UPDATE CATEGORY ==============================
  updateCategory: async (
    id: string,
    data: { name?: string; isActive?: boolean }
  ) => {
    // check category exists
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new CustomAppError(404, "Category not found");
    }

    // check duplicate name (if updating name)
    if (data.name) {
      const existing = await prisma.category.findFirst({
        where: {
          name: data.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new CustomAppError(400, "Category name already exists");
      }
    }

    // update category
    return prisma.category.update({
      where: { id },
      data,
    });
  },

  // ============================== DELETE CATEGORY ==============================
  deleteCategory: async (id: string) => {
    // check category exists
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new CustomAppError(404, "Category not found");
    }

    // delete category
    return prisma.category.delete({
      where: { id },
    });
  },

  // ============================== TOGGLE CATEGORY STATUS ==============================
  toggleCategoryStatus: async (id: string) => {
    // check category exists
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new CustomAppError(404, "Category not found");
    }

    // toggle active status
    return prisma.category.update({
      where: { id },
      data: {
        isActive: !category.isActive,
      },
    });
  },
};