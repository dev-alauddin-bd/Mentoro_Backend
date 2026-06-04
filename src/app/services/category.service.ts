import { prisma } from "../../lib/prisma";
import redisClient from "../../lib/redis";
import { CustomAppError } from "../errors/customError";
import { ICategory } from "../interfaces/category.interface";
import { getQueryObject, IQuery } from "../utils/query";

export const categoryService = {

  // ============================== CREATE CATEGORY ==============================
createCategory: async (data: ICategory) => {
  // check if category already exists
  const existingCategory = await prisma.category.findUnique({
    where: { name: data.name },
  });

  if (existingCategory) {
    throw new CustomAppError(400, "Category name already exists.");
  }

  const newCategory = await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      isActive: data.isActive ?? true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // ================= REDIS CACHE INVALIDATE =================
  const keys = await redisClient.keys("categories:*");

  if (keys.length) {
    await redisClient.del(...keys);
  }

  return newCategory;
},


  // ============================== GET ALL CATEGORIES ==============================
getAllCategories: async (query: IQuery) => {
  const q = getQueryObject(query);
  const { limit, page, search } = q;

  const cacheKey = `categories:${JSON.stringify(q)}`;

  // 1. Check Redis
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const computedSkip =
    page && limit ? (Number(page) - 1) * Number(limit) : 0;

  const where: any = {};

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
      skip: computedSkip,
      ...(limit ? { take: Number(limit) } : {}),
    }),

    prisma.category.count({ where }),
  ]);

  const result = {
    data: categories,
    meta: {
      page: Number(page) || 1,
      limit: limit ? Number(limit) : total,
      totalPages: limit ? Math.ceil(total / Number(limit)) : 1,
    },
  };

  // 2. Save Redis (1 hour)
  await redisClient.set(
    cacheKey,
    JSON.stringify(result),
    "EX",
    60 * 60
  );

  return result;
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
    const deleted = await prisma.category.delete({
      where: { id },
    });
    return { data: deleted };
  },

  // ============================== TOGGLE CATEGORY STATUS ==============================
  toggleCategoryStatus: async (id: string) => {
    // check category exists
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new CustomAppError(404, "Category not found");
    }

    // toggle active status
    const updated = await prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive },
    });
    return { data: { isActive: updated.isActive } };
  },
};