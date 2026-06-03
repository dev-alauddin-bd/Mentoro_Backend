import { categoryService } from '../services/category.service';
import { prisma } from '../../lib/prisma';
import { CustomAppError } from '../errors/customError';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    category: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Category Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- CREATE CATEGORY ----------
  it('creates a category when name is unique', async () => {
    const payload = { name: 'Math', slug: 'math', isActive: true, };
    (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.category.create as jest.Mock).mockResolvedValue({
      id: 'c1',
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await categoryService.createCategory(payload);
    expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { name: payload.name } });
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: expect.objectContaining(payload),
      select: expect.objectContaining({ isActive: true,  }),
    });
    expect(result).toMatchObject({ id: 'c1', name: 'Math', });
  });

  it('throws when category name already exists', async () => {
    const payload = { name: 'Math', slug: 'math' };
    (prisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 'c1' });
    await expect(categoryService.createCategory(payload as any)).rejects.toBeInstanceOf(CustomAppError);
  });

  // ---------- GET ALL CATEGORIES ----------
  it('gets all categories with pagination meta', async () => {
    const mockCategories = [{ id: 'c1', name: 'Math', isActive: true }];
    (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);
    (prisma.category.count as jest.Mock).mockResolvedValue(1);

    const result = await categoryService.getAllCategories({ limit: '5', page: '2' } as any);
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5, skip: 5 })
    );
    expect(result).toMatchObject({
      data: mockCategories,
      meta: { page: 2, limit: 5, totalPages: 1 },
    });
  });

  it('applies search filter when provided', async () => {
    const mockCategories = [];
    (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);
    (prisma.category.count as jest.Mock).mockResolvedValue(0);

    await categoryService.getAllCategories({ search: 'math' } as any);
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) })
    );
  });

  // ---------- UPDATE CATEGORY ----------
  it('updates an existing category', async () => {
    const existing = { id: 'c1', name: 'Math' };
    (prisma.category.findUnique as jest.Mock).mockResolvedValue(existing);
    (prisma.category.update as jest.Mock).mockResolvedValue({ ...existing, name: 'Science' });

    const result = await categoryService.updateCategory('c1', { name: 'Science' });
    expect(result).toMatchObject({ name: 'Science' });
  });

  it('throws 404 when updating non‑existent category', async () => {
    (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(categoryService.updateCategory('missing', { name: 'X' })).rejects.toBeInstanceOf(CustomAppError);
  });

  it('throws 400 on duplicate name during update', async () => {
    (prisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 'c1' });
    (prisma.category.findFirst as jest.Mock).mockResolvedValue({ id: 'c2' }); // another category with same name
    await expect(categoryService.updateCategory('c1', { name: 'Dup' })).rejects.toBeInstanceOf(CustomAppError);
  });

  // ---------- DELETE CATEGORY ----------
  it('deletes an existing category', async () => {
    const cat = { id: 'c1' };
    (prisma.category.findUnique as jest.Mock).mockResolvedValue(cat);
    (prisma.category.delete as jest.Mock).mockResolvedValue(cat);
    const result = await categoryService.deleteCategory('c1');
    expect(result).toEqual({ data: cat });
  });

  it('throws 404 when deleting non‑existent category', async () => {
    (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(categoryService.deleteCategory('missing')).rejects.toBeInstanceOf(CustomAppError);
  });

  // ---------- TOGGLE CATEGORY STATUS ----------
  it('toggles active status', async () => {
    const cat = { id: 'c1', isActive: true };
    (prisma.category.findUnique as jest.Mock).mockResolvedValue(cat);
    (prisma.category.update as jest.Mock).mockResolvedValue({ ...cat, isActive: false });
    const result = await categoryService.toggleCategoryStatus('c1');
    expect(result).toEqual({ data: { isActive: false } });
  });

  it('throws 404 when toggling status of missing category', async () => {
    (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(categoryService.toggleCategoryStatus('missing')).rejects.toBeInstanceOf(CustomAppError);
  });
});
