import { Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse";
import { lessonService } from "../services/lesson.service";
import { lessonController } from "../controllers/lesson.controller";

jest.mock("../services/lesson.service");
jest.mock("../utils/sendResponse");

const mockSendResponse = sendResponse as jest.Mock;
const mockLessonService = lessonService as any;

const mockReq = (overrides = {}) => {
  return {
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as Request;
};

const mockRes = () => {
  const res = {} as Partial<Response>;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res as Response;
};

describe("lessonController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("addLesson should create lesson and respond", async () => {
    const req = mockReq({ body: { title: "Lesson 1" } });
    const res = mockRes();
    const created = { id: "l1", title: "Lesson 1" };
    mockLessonService.addLesson.mockResolvedValue(created);

    await (lessonController.addLesson as any)(req, res);
    expect(mockLessonService.addLesson).toHaveBeenCalledWith(req.body);
    expect(mockSendResponse).toHaveBeenCalledWith(
      res,
      201,
      "Lesson added successfully",
      created
    );
  });

  it("updateLesson should update and respond", async () => {
    const req = mockReq({ params: { lessonId: "l1" }, body: { title: "Updated" } });
    const res = mockRes();
    const updated = { id: "l1", title: "Updated" };
    mockLessonService.updateLesson.mockResolvedValue(updated);

    await (lessonController.updateLesson as any)(req, res);
    expect(mockLessonService.updateLesson).toHaveBeenCalledWith("l1", req.body);
    expect(mockSendResponse).toHaveBeenCalledWith(
      res,
      200,
      "Lesson updated successfully",
      updated
    );
  });

  it("deleteLesson should delete and respond", async () => {
    const req = mockReq({ params: { lessonId: "l2" } });
    const res = mockRes();
    mockLessonService.deleteLesson.mockResolvedValue(undefined);

    await (lessonController.deleteLesson as any)(req, res);
    expect(mockLessonService.deleteLesson).toHaveBeenCalledWith("l2");
    expect(mockSendResponse).toHaveBeenCalledWith(
      res,
      200,
      "Lesson deleted successfully"
    );
  });

  it("getLessonById should fetch lesson and respond", async () => {
    const req = mockReq({ params: { lessonId: "l3" } });
    const res = mockRes();
    const lesson = { id: "l3", title: "Lesson 3" };
    mockLessonService.getLessonById.mockResolvedValue(lesson);

    await (lessonController.getLessonById as any)(req, res);
    expect(mockLessonService.getLessonById).toHaveBeenCalledWith("l3");
    expect(mockSendResponse).toHaveBeenCalledWith(
      res,
      200,
      "Lesson fetched successfully",
      lesson
    );
  });

  it("getAllLessons should fetch list and respond", async () => {
    const req = mockReq({ query: { moduleId: "m1" } });
    const res = mockRes();
    const data = [{ id: "l4" }];
    const meta = { total: 1, page: 1 };
    mockLessonService.getAllLessons.mockResolvedValue({ data, meta });

    await (lessonController.getAllLessons as any)(req, res);
    expect(mockLessonService.getAllLessons).toHaveBeenCalledWith("m1");
    expect(mockSendResponse).toHaveBeenCalledWith(
      res,
      200,
      "Lessons fetched successfully",
      data,
      meta
    );
  });
});
