import { Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse";
import { dashboardService } from "../services/dashboard.service";
import { dashboardController } from "../controllers/dashboard.controller";

jest.mock("../services/dashboard.service");
jest.mock("../utils/sendResponse");

const mockSendResponse = sendResponse as jest.Mock;
const mockDashboardService = dashboardService as any;

const mockReq = (overrides = {}) => {
  return {
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

describe("dashboardController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAdminAnalytics should fetch data and respond", async () => {
    const req = mockReq();
    const res = mockRes();
    const data = { users: 10, courses: 5 };
    mockDashboardService.getAdminAnalytics.mockResolvedValue(data);

    await (dashboardController.getAdminAnalytics as any)(req, res);
    expect(mockDashboardService.getAdminAnalytics).toHaveBeenCalled();
    expect(mockSendResponse).toHaveBeenCalledWith(
      res,
      200,
      "Admin analytics retrieved",
      data
    );
  });

  it("getInstructorAnalytics should use user id and respond", async () => {
    const req = mockReq({ user: { id: "inst1" } });
    const res = mockRes();
    const data = { coursesTaught: 2 };
    mockDashboardService.getInstructorAnalytics.mockResolvedValue(data);

    await (dashboardController.getInstructorAnalytics as any)(req, res);
    expect(mockDashboardService.getInstructorAnalytics).toHaveBeenCalledWith(
      "inst1"
    );
    expect(mockSendResponse).toHaveBeenCalledWith(
      res,
      200,
      "Instructor analytics retrieved",
      data
    );
  });

  it("getStudentAnalytics should use user id and respond", async () => {
    const req = mockReq({ user: { id: "stud1" } });
    const res = mockRes();
    const data = { coursesEnrolled: 3 };
    mockDashboardService.getStudentAnalytics.mockResolvedValue(data);

    await (dashboardController.getStudentAnalytics as any)(req, res);
    expect(mockDashboardService.getStudentAnalytics).toHaveBeenCalledWith(
      "stud1"
    );
    expect(mockSendResponse).toHaveBeenCalledWith(
      res,
      200,
      "Student analytics retrieved",
      data
    );
  });
});
