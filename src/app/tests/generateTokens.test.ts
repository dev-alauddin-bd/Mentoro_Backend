import jwt from "jsonwebtoken";
import { generateTokens } from "../utils/generateTokens";

describe("generateTokens utility", () => {
  const ORIGINAL_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
  const ORIGINAL_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = "access_secret_test";
    process.env.JWT_REFRESH_SECRET = "refresh_secret_test";
  });

  afterAll(() => {
    process.env.JWT_ACCESS_SECRET = ORIGINAL_ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET = ORIGINAL_REFRESH_SECRET;
  });

  it("should generate valid access and refresh tokens", () => {
    const user = { id: "1", email: "test@example.com", role: "student" };
    const { accessToken, refreshToken } = generateTokens(user);

    const decodedAccess: any = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!);
    const decodedRefresh: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);

    expect(decodedAccess.id).toBe(user.id);
    expect(decodedAccess.email).toBe(user.email);
    expect(decodedAccess.role).toBe(user.role);
    expect(decodedRefresh.id).toBe(user.id);
    expect(decodedRefresh.email).toBe(user.email);
    expect(decodedRefresh.role).toBe(user.role);
  });

  it("should throw if access secret is missing", () => {
    delete process.env.JWT_ACCESS_SECRET;
    const user = { id: "1", email: "test@example.com", role: "student" };
    expect(() => generateTokens(user)).toThrow();
    // restore for subsequent tests
    process.env.JWT_ACCESS_SECRET = "access_secret_test";
  });

  it("should throw if refresh secret is missing", () => {
    delete process.env.JWT_REFRESH_SECRET;
    const user = { id: "1", email: "test@example.com", role: "student" };
    expect(() => generateTokens(user)).toThrow();
    // restore for afterAll
    process.env.JWT_REFRESH_SECRET = "refresh_secret_test";
  });
});
