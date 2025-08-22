import { test, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only module first
vi.mock("server-only", () => ({}));

// Mock dependencies
vi.mock("next/headers");
vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(), 
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mocked-jwt-token"),
  })),
  jwtVerify: vi.fn(),
}));

// Import after mocking server-only
const { createSession, getSession } = await import("@/lib/auth");
const { cookies } = await import("next/headers");
const { jwtVerify } = await import("jose");

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCookieStore.set.mockClear();
  mockCookieStore.get.mockClear();
  mockCookieStore.delete.mockClear();
  mockCookies.mockResolvedValue(mockCookieStore as any);
  mockJwtVerify.mockClear();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

test("createSession creates a JWT token and sets cookie with correct options", async () => {
  const testUserId = "user-123";
  const testEmail = "test@example.com";

  await createSession(testUserId, testEmail);

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    "mocked-jwt-token",
    expect.objectContaining({
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expect.any(Date),
    })
  );

  // Verify cookie expiration is set to 7 days from now
  const cookieCall = mockCookieStore.set.mock.calls[0];
  const cookieOptions = cookieCall[2];
  const expiresDate = cookieOptions.expires;
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  // Allow for small timing differences (within 1000ms)
  expect(Math.abs(expiresDate.getTime() - sevenDaysFromNow.getTime())).toBeLessThan(1000);
});

test("createSession uses development settings in non-production environment", async () => {
  vi.stubEnv("NODE_ENV", "development");

  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    "mocked-jwt-token", 
    expect.objectContaining({
      secure: false,
    })
  );

  vi.unstubAllEnvs();
});

test("createSession uses secure settings in production environment", async () => {
  vi.stubEnv("NODE_ENV", "production");

  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    "mocked-jwt-token",
    expect.objectContaining({
      secure: true,
    })
  );

  vi.unstubAllEnvs();
});

test("createSession creates JWT with correct payload structure", async () => {
  const { SignJWT } = await import("jose");
  const mockSignJWT = vi.mocked(SignJWT);
  
  const testUserId = "user-456";
  const testEmail = "test@domain.com";

  const mockJWTInstance = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("test-token"),
  };

  mockSignJWT.mockImplementation((payload) => {
    expect(payload).toEqual(
      expect.objectContaining({
        userId: testUserId,
        email: testEmail,
        expiresAt: expect.any(Date),
      })
    );
    return mockJWTInstance as any;
  });

  await createSession(testUserId, testEmail);

  expect(mockJWTInstance.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  expect(mockJWTInstance.setExpirationTime).toHaveBeenCalledWith("7d");
  expect(mockJWTInstance.setIssuedAt).toHaveBeenCalled();
  expect(mockJWTInstance.sign).toHaveBeenCalled();
});

test("createSession handles JWT signing errors gracefully", async () => {
  const { SignJWT } = await import("jose");
  const mockSignJWT = vi.mocked(SignJWT);
  
  const mockJWTInstance = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockRejectedValue(new Error("JWT signing failed")),
  };

  mockSignJWT.mockImplementation(() => mockJWTInstance as any);

  await expect(createSession("user-123", "test@example.com")).rejects.toThrow("JWT signing failed");
  
  // Ensure cookie is not set when JWT signing fails
  expect(mockCookieStore.set).not.toHaveBeenCalled();
});

// getSession tests
test("getSession returns null when no auth token cookie exists", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const result = await getSession();

  expect(result).toBeNull();
  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(mockJwtVerify).not.toHaveBeenCalled();
});

test("getSession returns null when auth token cookie has no value", async () => {
  mockCookieStore.get.mockReturnValue({});

  const result = await getSession();

  expect(result).toBeNull();
  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(mockJwtVerify).not.toHaveBeenCalled();
});

test("getSession returns session payload when token is valid", async () => {
  const mockToken = "valid-jwt-token";
  const mockPayload = {
    userId: "user-123",
    email: "test@example.com",
    expiresAt: new Date("2024-12-31T23:59:59Z"),
  };

  mockCookieStore.get.mockReturnValue({ value: mockToken });
  mockJwtVerify.mockResolvedValue({ payload: mockPayload });

  const result = await getSession();

  expect(result).toEqual(mockPayload);
  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(mockJwtVerify).toHaveBeenCalledWith(mockToken, expect.anything());
});

test("getSession returns null when JWT verification fails", async () => {
  const mockToken = "invalid-jwt-token";

  mockCookieStore.get.mockReturnValue({ value: mockToken });
  mockJwtVerify.mockRejectedValue(new Error("JWT verification failed"));

  const result = await getSession();

  expect(result).toBeNull();
  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(mockJwtVerify).toHaveBeenCalledWith(mockToken, expect.anything());
});

test("getSession returns null when JWT verification throws any error", async () => {
  const mockToken = "malformed-jwt-token";

  mockCookieStore.get.mockReturnValue({ value: mockToken });
  mockJwtVerify.mockRejectedValue(new TypeError("Invalid JWT format"));

  const result = await getSession();

  expect(result).toBeNull();
  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(mockJwtVerify).toHaveBeenCalledWith(mockToken, expect.anything());
});

test("getSession handles expired tokens gracefully", async () => {
  const mockToken = "expired-jwt-token";

  mockCookieStore.get.mockReturnValue({ value: mockToken });
  mockJwtVerify.mockRejectedValue(new Error("JWT expired"));

  const result = await getSession();

  expect(result).toBeNull();
  expect(mockJwtVerify).toHaveBeenCalledWith(mockToken, expect.anything());
});

test("getSession calls jwtVerify with token and secret", async () => {
  const mockToken = "test-token";
  const mockPayload = {
    userId: "user-456",
    email: "user@test.com",
    expiresAt: new Date(),
  };

  mockCookieStore.get.mockReturnValue({ value: mockToken });
  mockJwtVerify.mockResolvedValue({ payload: mockPayload });

  await getSession();

  expect(mockJwtVerify).toHaveBeenCalledWith(mockToken, expect.anything());
  expect(mockJwtVerify).toHaveBeenCalledTimes(1);
});

test("getSession returns session with correct type structure", async () => {
  const mockToken = "valid-token";
  const mockPayload = {
    userId: "test-user-id",
    email: "test@example.com",
    expiresAt: new Date("2024-06-01T00:00:00Z"),
    iat: 1234567890,
    exp: 1234567890 + 7 * 24 * 60 * 60,
  };

  mockCookieStore.get.mockReturnValue({ value: mockToken });
  mockJwtVerify.mockResolvedValue({ payload: mockPayload });

  const result = await getSession();

  expect(result).toEqual(expect.objectContaining({
    userId: expect.any(String),
    email: expect.any(String),
    expiresAt: expect.any(Date),
  }));
  expect(result?.userId).toBe("test-user-id");
  expect(result?.email).toBe("test@example.com");
});