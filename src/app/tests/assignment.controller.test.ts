import { Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse";
import { AssignmentService } from "../services/assignment.service";
import { assignmentController } from "../controllers/assignment.controller";

jest.mock("../services/assignment.service");
jest.mock("../utils/sendResponse");

const mockSendResponse = sendResponse as jest.Mock;
const mockAssignmentService = AssignmentService as any;

const mockReq = (overrides = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: "user1" },
    ...overrides,
  } as unknown as Request;
};

const mockRes = () => {
  const res = {} as Partial<Response>;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res as Response;
};

describe("assignmentController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createAssignment should create and respond", async () => {
    const req = mockReq({ body: { title: "Test" } });
    const res = mockRes();
    const created = { id: "a1", title: "Test" };
    mockAssignmentService.createAssignment.mockResolvedValue(created);

    await (assignmentController.createAssignment as any)(req, res);
    expect(mockAssignmentService.createAssignment).toHaveBeenCalledWith(req.body);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 201, "Assignment created successfully", created);
  });

  it("getAssignmentsIntoIntrutorCourses should fetch and respond", async () => {
    const req = mockReq({ query: { page: 1 } });
    const res = mockRes();
    const data = [{ id: "a1" }];
    const meta = { total: 1, page: 1 };
    mockAssignmentService.getAssignmentsIntoIntrutorCourses.mockResolvedValue({ data, meta });

    await (assignmentController.getAssignmentsIntoIntrutorCourses as any)(req, res);
    expect(mockAssignmentService.getAssignmentsIntoIntrutorCourses).toHaveBeenCalledWith(req.user!.id, req.query);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Instructor assignments fetched successfully", data, meta);
  });

  it("updateAssignment should update and respond", async () => {
    const req = mockReq({ params: { id: "a1" }, body: { title: "Updated" } });
    const res = mockRes();
    const updated = { id: "a1", title: "Updated" };
    mockAssignmentService.updateAssignment.mockResolvedValue(updated);

    await (assignmentController.updateAssignment as any)(req, res);
    expect(mockAssignmentService.updateAssignment).toHaveBeenCalledWith("a1", req.body);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Assignment updated successfully", updated);
  });

  it("deleteAssignment should delete and respond", async () => {
    const req = mockReq({ params: { id: "a1" } });
    const res = mockRes();
    mockAssignmentService.deleteAssignment.mockResolvedValue(undefined);

    await (assignmentController.deleteAssignment as any)(req, res);
    expect(mockAssignmentService.deleteAssignment).toHaveBeenCalledWith("a1");
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Assignment deleted successfully");
  });

  it("submitAssignment should submit and respond", async () => {
    const req = mockReq({ body: { assignmentId: "a1", content: "My answer" } });
    const res = mockRes();
    const submission = { id: "s1", content: "My answer" };
    mockAssignmentService.submitAssignment.mockResolvedValue(submission);

    await (assignmentController.submitAssignment as any)(req, res);
    expect(mockAssignmentService.submitAssignment).toHaveBeenCalledWith(req.body.assignmentId, req.user!.id, req.body.content);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 201, "Assignment submitted successfully", submission);
  });
});
