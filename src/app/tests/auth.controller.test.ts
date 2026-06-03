import { Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse";
import { clearRefreshTokenCookie, setRefreshTokenCookie } from "../utils/cookie";
import { authServices } from "../services/auth.service";
import { authControllers } from "../controllers/auth.controller";

jest.mock("../services/auth.service");
jest.mock("../utils/cookie");
jest.mock("../utils/sendResponse");

const mockSendResponse = sendResponse as jest.Mock;
const mockSetRefresh = setRefreshTokenCookie as jest.Mock;
const mockClearRefresh = clearRefreshTokenCookie as jest.Mock;
const mockAuthServices = authServices as any;

const mockReq = (overrides = {}) => {
  return {
    body: {},
    cookies: {},
    ...overrides,
  } as unknown as Request;
};

const mockRes = () => {
  const res = {} as Partial<Response>;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res as Response;
};

describe("authControllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("register should call service, set cookie and send response", async () => {
    const req = mockReq({ body: { email: "test@example.com" } });
    const res = mockRes();
    const serviceResult = { accessToken: "at", refreshToken: "rt", user: { id: "u1" } };
    mockAuthServices.register.mockResolvedValue(serviceResult);

    await (authControllers.register as any)(req, res);
    expect(mockAuthServices.register).toHaveBeenCalledWith(req.body);
    expect(mockSetRefresh).toHaveBeenCalledWith(res, serviceResult.refreshToken);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 201, "User registered successfully", {
      user: serviceResult.user,
      accessToken: serviceResult.accessToken,
    });
  });

  it("login should call service, set cookie and send response", async () => {
    const req = mockReq({ body: { email: "test@example.com" } });
    const res = mockRes();
    const serviceResult = { accessToken: "at", refreshToken: "rt", user: { id: "u1" } };
    mockAuthServices.login.mockResolvedValue(serviceResult);

    await (authControllers.login as any)(req, res);
    expect(mockAuthServices.login).toHaveBeenCalledWith(req.body);
    expect(mockSetRefresh).toHaveBeenCalledWith(res, serviceResult.refreshToken);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "User logged in successfully", {
      user: serviceResult.user,
      accessToken: serviceResult.accessToken,
    });
  });

  it("refreshToken should use cookie, set new cookie and respond", async () => {
    const req = mockReq({ cookies: { refreshToken: "oldRt" } });
    const res = mockRes();
    const serviceResult = { accessToken: "newAt", refreshToken: "newRt", user: { id: "u2" } };
    mockAuthServices.refreshToken.mockResolvedValue(serviceResult);

    await (authControllers.refreshToken as any)(req, res);
    expect(mockAuthServices.refreshToken).toHaveBeenCalledWith("oldRt");
    expect(mockSetRefresh).toHaveBeenCalledWith(res, serviceResult.refreshToken);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Access token refreshed", {
      user: serviceResult.user,
      accessToken: serviceResult.accessToken,
    });
  });

  it("logout should clear cookie and send response", async () => {
    const req = mockReq();
    const res = mockRes();

    await (authControllers.logout as any)(req, res);
    expect(mockClearRefresh).toHaveBeenCalledWith(res);
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Logged out successfully");
  });

  it("verifySession should verify token and respond", async () => {
    const req = mockReq({ cookies: { refreshToken: "rt" } });
    const res = mockRes();
    const user = { id: "u3" };
    mockAuthServices.verifySession.mockResolvedValue(user);

    await (authControllers.verifySession as any)(req, res);
    expect(mockAuthServices.verifySession).toHaveBeenCalledWith("rt");
    expect(mockSendResponse).toHaveBeenCalledWith(res, 200, "Session verified", user);
  });
});
