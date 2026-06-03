import { Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse";
import { userService } from "../services/user.service";
import { userController } from "../controllers/user.controller";


jest.mock("../services/user.service");
jest.mock("../utils/sendResponse");

const mockSendResponse = sendResponse as jest.Mock;
const mockUserService = userService as any;

const mockReq = (overrides = {}) => {
  return {
    params: {},
    query: {},
    body: {},
    user: { id: "user1" },
    file: {},
    ...overrides,
  } as unknown as Request;
};

const mockRes = () => {
  const res = {} as Partial<Response>;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res as Response;
};

describe("userController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAllUsers should fetch users and send response", async () => {
    const req = mockReq();
    const res = mockRes();
    const data = [{ id: "u1" }];
    const meta = { total: 1, page: 1 };
    mockUserService.getAllUsers.mockResolvedValue({ data, meta });

    await (userController.getAllUsers as any)(req, res);
    expect(mockUserService.getAllUsers).toHaveBeenCalledWith(req.user, req.query);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Users retrieved successfully", data, meta);
  });

  it("updateUserRole should call service and respond", async () => {
    const req = mockReq({ params: { id: "u1" }, body: { role: "admin" } });
    const res = mockRes();
    const updated = { id: "u1", role: "admin" };
    mockUserService.updateUserRole.mockResolvedValue(updated);

    await (userController.updateUserRole as any)(req, res);
    expect(mockUserService.updateUserRole).toHaveBeenCalledWith("u1", "admin");
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "User role updated successfully", updated);
  });

  it("updateUserStatus should call service and respond", async () => {
    const req = mockReq({ params: { id: "u2" }, body: { status: "active" } });
    const res = mockRes();
    const updated = { id: "u2", status: "active" };
    mockUserService.updateUserStatus.mockResolvedValue(updated);

    await (userController.updateUserStatus as any)(req, res);
    expect(mockUserService.updateUserStatus).toHaveBeenCalledWith("u2", "active");
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "User status updated successfully", updated);
  });

  it("becomeInstructor should call service and respond", async () => {
    const req = mockReq();
    const res = mockRes();
    mockUserService.becomeInstructor.mockResolvedValue(undefined);

    await (userController.becomeInstructor as any)(req, res);
    expect(mockUserService.becomeInstructor).toHaveBeenCalledWith("user1");
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Success: You are now an instructor!");
  });

  it("updateProfile should call service with name and avatar and respond", async () => {
    const req = mockReq({ body: { name: "New Name" }, file: { path: "avatar.png" } });
    const res = mockRes();
    const updated = { id: "user1", name: "New Name", avatar: "avatar.png" };
    mockUserService.updateProfile.mockResolvedValue(updated);

    await (userController.updateProfile as any)(req, res);
    expect(mockUserService.updateProfile).toHaveBeenCalledWith("user1", { name: "New Name", avatar: "avatar.png" });
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Profile updated successfully", updated);
  });
});
