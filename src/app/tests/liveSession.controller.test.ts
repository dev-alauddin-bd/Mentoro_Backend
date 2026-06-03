import { Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse";
import { liveSessionService } from "../services/liveSession.service";
import { liveSessionController } from "../controllers/liveSession.controller";

jest.mock("../services/liveSession.service");
jest.mock("../utils/sendResponse");

const mockSendResponse = sendResponse as jest.Mock;
const mockLiveSessionService = liveSessionService as any;

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

describe("liveSessionController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registerForSession should create and respond", async () => {
    const req = mockReq({ body: { sessionId: "s1" } });
    const res = mockRes();
    const result = { id: "r1" };
    mockLiveSessionService.registerForSession.mockResolvedValue(result);

    await (liveSessionController.registerForSession as any)(req, res);
    expect(mockLiveSessionService.registerForSession).toHaveBeenCalledWith(req.body);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 201, "Registration successful", result);
  });

  it("getAllSessions should fetch and respond", async () => {
    const req = mockReq();
    const res = mockRes();
    const data = [{ id: "s1" }];
    const meta = { total: 1, page: 1 };
    mockLiveSessionService.getAllSessions.mockResolvedValue({ data, meta });

    await (liveSessionController.getAllSessions as any)(req, res);
    expect(mockLiveSessionService.getAllSessions).toHaveBeenCalledWith(req.query);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Sessions fetched successfully", data, meta);
  });

  it("getSessionById should fetch single and respond", async () => {
    const req = mockReq({ params: { id: "s2" } });
    const res = mockRes();
    const result = { id: "s2" };
    mockLiveSessionService.getSessionById.mockResolvedValue(result);

    await (liveSessionController.getSessionById as any)(req, res);
    expect(mockLiveSessionService.getSessionById).toHaveBeenCalledWith("s2");
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Session fetched successfully", result);
  });

  it("updateSession should update and respond", async () => {
    const req = mockReq({ params: { id: "s3" }, body: { title: "New" } });
    const res = mockRes();
    const result = { id: "s3", title: "New" };
    mockLiveSessionService.updateSession.mockResolvedValue(result);

    await (liveSessionController.updateSession as any)(req, res);
    expect(mockLiveSessionService.updateSession).toHaveBeenCalledWith("s3", req.body);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Session updated successfully", result);
  });

  it("deleteSession should delete and respond", async () => {
    const req = mockReq({ params: { id: "s4" } });
    const res = mockRes();
    const result = { success: true };
    mockLiveSessionService.deleteSession.mockResolvedValue(result);

    await (liveSessionController.deleteSession as any)(req, res);
    expect(mockLiveSessionService.deleteSession).toHaveBeenCalledWith("s4");
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Session deleted successfully", result);
  });

  it("getRegistrants should fetch and respond", async () => {
    const req = mockReq({ params: { id: "s5" }, query: { page: 1 } });
    const res = mockRes();
    const result = { registrants: [] };
    mockLiveSessionService.getRegistrantsBySessionId.mockResolvedValue(result);

    await (liveSessionController.getRegistrants as any)(req, res);
    expect(mockLiveSessionService.getRegistrantsBySessionId).toHaveBeenCalledWith("s5", req.query);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Registrants fetched successfully", result);
  });
});
