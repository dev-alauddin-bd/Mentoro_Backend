import { authServices } from "../services/auth.service";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateTokens } from "../utils/generateTokens";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../utils/generateTokens");

describe("Auth Service - Full Coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register user successfully", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "1",
      name: "Test",
      email: "test@gmail.com",
      password: "hashedPassword",
      role: "student",
    });

    (generateTokens as jest.Mock).mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
    });

    const result = await authServices.register({
      name: "Test",
      email: "test@gmail.com",
      password: "123456",
    } as any);

    expect(result.accessToken).toBe("access");
  });

  it("should throw if user already exists", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      email: "test@gmail.com",
    });

    await expect(
      authServices.register({
        name: "Test",
        email: "test@gmail.com",
        password: "123456",
      } as any)
    ).rejects.toThrow();
  });

  it("should login successfully", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      email: "test@gmail.com",
      password: "hashed",
      role: "student",
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    (generateTokens as jest.Mock).mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
    });

    const result = await authServices.login({
      email: "test@gmail.com",
      password: "123456",
    });

    expect(result.accessToken).toBe("access");
  });

  it("should throw if user not found", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      authServices.login({
        email: "wrong@gmail.com",
        password: "123456",
      })
    ).rejects.toThrow();
  });

  it("should fail on wrong password", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      email: "test@gmail.com",
      password: "hashed",
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      authServices.login({
        email: "test@gmail.com",
        password: "wrong",
      })
    ).rejects.toThrow();
  });

  it("should throw when email or password is missing", async () => {
    await expect(
      authServices.login({
        email: "",
        password: "",
      } as any)
    ).rejects.toThrow();
  });

  it("should refresh token successfully", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "1" });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      email: "test@gmail.com",
      role: "student",
      status: "active",
    });

    (generateTokens as jest.Mock).mockReturnValue({
      accessToken: "new_access",
      refreshToken: "new_refresh",
    });

    const result = await authServices.refreshToken("valid_token");

    expect(result.accessToken).toBe("new_access");
  });

  it("should fail refresh token when no token is provided", async () => {
    await expect(authServices.refreshToken("")).rejects.toThrow();
  });

  it("should fail refresh token if invalid", async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid");
    });

    await expect(
      authServices.refreshToken("bad_token")
    ).rejects.toThrow();
  });

  it("should fail refresh token if user is blocked", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "1" });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      status: "blocked",
    });

    await expect(
      authServices.refreshToken("valid_token")
    ).rejects.toThrow();
  });

  it("should verify session successfully", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "1" });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      email: "test@gmail.com",
      role: "student",
      status: "active",
      password: "hashed",
    });

    const result = await authServices.verifySession("token");

    expect(result.email).toBe("test@gmail.com");
  });

  it("should fail verify session when no token is provided", async () => {
    await expect(authServices.verifySession("")).rejects.toThrow();
  });

  it("should fail verify session when token is invalid", async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid");
    });
    await expect(authServices.verifySession("invalid_token")).rejects.toMatchObject({ statusCode: 401 });
  });

  it("should fail if user is blocked", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "1" });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      status: "blocked",
    });

    await expect(
      authServices.verifySession("token")
    ).rejects.toThrow();
  });
});