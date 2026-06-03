import { lessonService } from '../services/lesson.service';
import { prisma } from '../../lib/prisma';
import { CustomAppError } from '../errors/customError';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    lesson: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    module: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('Lesson Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- GET ALL LESSONS ----------------
  it('gets all lessons with pagination meta', async () => {
    const mockLessons = [{ id: 'l1', title: 'Lesson 1' }];
    (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
    (prisma.lesson.count as jest.Mock).mockResolvedValue(1);

    const result = await lessonService.getAllLessons(undefined, { page: '2', limit: '5' } as any);
    expect(prisma.lesson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: expect.any(Number), take: 5 })
    );
    expect(result).toMatchObject({
      data: mockLessons,
      meta: { page: 2, limit: 5, totalPages: 1 },
    });
  });

  // ---------------- GET LESSON BY ID ----------------
  it('returns lesson when found by id', async () => {
    const mockLesson = { id: 'l1', title: 'Lesson 1' };
    (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);

    const result = await lessonService.getLessonById('l1');
    expect(result).toEqual({ data: mockLesson });
  });

  it('throws CustomAppError when lesson not found', async () => {
    (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(lessonService.getLessonById('missing')).rejects.toBeInstanceOf(CustomAppError);
  });

  // ---------------- ADD LESSON ----------------
  it('adds a lesson with correct order when module exists', async () => {
    const payload = { moduleId: 'm1', title: 'New Lesson', videoUrl: 'url', duration: 10 };
    (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: 'm1' });
    (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({ order: 2 });
    const createdLesson = { id: 'l2', ...payload, order: 3 };
    (prisma.lesson.create as jest.Mock).mockResolvedValue(createdLesson);

    const result = await lessonService.addLesson(payload);
    expect(prisma.module.findUnique).toHaveBeenCalledWith({ where: { id: 'm1' } });
    expect(prisma.lesson.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order: 3 }) })
    );
    expect(result).toEqual({ data: createdLesson });
  });

  it('throws CustomAppError when parent module not found', async () => {
    (prisma.module.findUnique as jest.Mock).mockResolvedValue(null);
    const payload = { moduleId: 'invalid', title: 'L', videoUrl: 'v', duration: 5 };
    await expect(lessonService.addLesson(payload)).rejects.toBeInstanceOf(CustomAppError);
  });

  // ---------------- UPDATE LESSON ----------------
  it('updates lesson when it exists', async () => {
    const lesson = { id: 'l1', title: 'Old' };
    (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(lesson);
    const updated = { id: 'l1', title: 'New' };
    (prisma.lesson.update as jest.Mock).mockResolvedValue(updated);

    const result = await lessonService.updateLesson('l1', { title: 'New' });
    expect(result).toEqual({ data: updated });
  });

  it('throws CustomAppError when lesson to update does not exist', async () => {
    (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(lessonService.updateLesson('missing', { title: 'X' })).rejects.toBeInstanceOf(CustomAppError);
  });

  // ---------------- DELETE LESSON ----------------
  it('deletes lesson when it exists', async () => {
    const lesson = { id: 'l1' };
    (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(lesson);
    (prisma.lesson.delete as jest.Mock).mockResolvedValue(lesson);

    const result = await lessonService.deleteLesson('l1');
    expect(result).toEqual({ data: lesson });
  });

  it('throws CustomAppError when lesson to delete does not exist', async () => {
    (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(lessonService.deleteLesson('missing')).rejects.toBeInstanceOf(CustomAppError);
  });
});
