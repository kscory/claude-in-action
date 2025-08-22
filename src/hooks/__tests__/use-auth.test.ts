import { renderHook, act, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock actions
vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

// Mock anon work tracker
vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

// Mock project actions
vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

describe("useAuth", () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue(mockRouter);
  });

  describe("initial state", () => {
    it("should return initial state with isLoading false", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    it("should handle successful sign in with anonymous work", async () => {
      const mockAnonWork = {
        messages: [{ role: "user", content: "test message" }],
        fileSystemData: { files: {} },
      };
      const mockProject = { id: "project-123" };

      (signInAction as Mock).mockResolvedValue({ success: true });
      (getAnonWorkData as Mock).mockReturnValue(mockAnonWork);
      (createProject as Mock).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn("test@example.com", "password123");
        expect(response).toEqual({ success: true });
      });

      expect(result.current.isLoading).toBe(false);
      expect(signInAction).toHaveBeenCalledWith("test@example.com", "password123");
      expect(getAnonWorkData).toHaveBeenCalled();
      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^Design from \d/),
        messages: mockAnonWork.messages,
        data: mockAnonWork.fileSystemData,
      });
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-123");
    });

    it("should handle successful sign in with existing projects", async () => {
      const mockProjects = [
        { id: "project-1", name: "Project 1" },
        { id: "project-2", name: "Project 2" },
      ];

      (signInAction as Mock).mockResolvedValue({ success: true });
      (getAnonWorkData as Mock).mockReturnValue(null);
      (getProjects as Mock).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(getProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-1");
    });

    it("should handle successful sign in with no existing projects", async () => {
      const mockNewProject = { id: "new-project-456" };

      (signInAction as Mock).mockResolvedValue({ success: true });
      (getAnonWorkData as Mock).mockReturnValue(null);
      (getProjects as Mock).mockResolvedValue([]);
      (createProject as Mock).mockResolvedValue(mockNewProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/new-project-456");
    });

    it("should handle sign in failure", async () => {
      const errorResult = { success: false, error: "Invalid credentials" };
      (signInAction as Mock).mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn("test@example.com", "wrongpassword");
        expect(response).toEqual(errorResult);
      });

      expect(result.current.isLoading).toBe(false);
      expect(getAnonWorkData).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should handle sign in with anonymous work but no messages", async () => {
      const mockAnonWork = {
        messages: [],
        fileSystemData: { files: {} },
      };
      const mockProjects = [{ id: "existing-project" }];

      (signInAction as Mock).mockResolvedValue({ success: true });
      (getAnonWorkData as Mock).mockReturnValue(mockAnonWork);
      (getProjects as Mock).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(createProject).not.toHaveBeenCalled();
      expect(getProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-project");
    });

    it("should set loading state during sign in", async () => {
      (signInAction as Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );
      (getAnonWorkData as Mock).mockReturnValue(null);
      (getProjects as Mock).mockResolvedValue([]);
      (createProject as Mock).mockResolvedValue({ id: "test-project" });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.signIn("test@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle errors during post sign in process", async () => {
      (signInAction as Mock).mockResolvedValue({ success: true });
      (getAnonWorkData as Mock).mockImplementation(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.signIn("test@example.com", "password123")).rejects.toThrow("Storage error");
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    it("should handle successful sign up with anonymous work", async () => {
      const mockAnonWork = {
        messages: [{ role: "user", content: "test message" }],
        fileSystemData: { files: { "test.js": "content" } },
      };
      const mockProject = { id: "signup-project-789" };

      (signUpAction as Mock).mockResolvedValue({ success: true });
      (getAnonWorkData as Mock).mockReturnValue(mockAnonWork);
      (createProject as Mock).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signUp("newuser@example.com", "password123");
        expect(response).toEqual({ success: true });
      });

      expect(signUpAction).toHaveBeenCalledWith("newuser@example.com", "password123");
      expect(getAnonWorkData).toHaveBeenCalled();
      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^Design from \d/),
        messages: mockAnonWork.messages,
        data: mockAnonWork.fileSystemData,
      });
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/signup-project-789");
    });

    it("should handle successful sign up without anonymous work", async () => {
      const mockNewProject = { id: "new-signup-project" };

      (signUpAction as Mock).mockResolvedValue({ success: true });
      (getAnonWorkData as Mock).mockReturnValue(null);
      (getProjects as Mock).mockResolvedValue([]);
      (createProject as Mock).mockResolvedValue(mockNewProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("newuser@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/new-signup-project");
    });

    it("should handle sign up failure", async () => {
      const errorResult = { success: false, error: "Email already exists" };
      (signUpAction as Mock).mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signUp("existing@example.com", "password123");
        expect(response).toEqual(errorResult);
      });

      expect(result.current.isLoading).toBe(false);
      expect(getAnonWorkData).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should set loading state during sign up", async () => {
      (signUpAction as Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );
      (getAnonWorkData as Mock).mockReturnValue(null);
      (getProjects as Mock).mockResolvedValue([]);
      (createProject as Mock).mockResolvedValue({ id: "test-project" });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.signUp("test@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle errors during post sign up process", async () => {
      (signUpAction as Mock).mockResolvedValue({ success: true });
      (getProjects as Mock).mockImplementation(() => {
        throw new Error("Database error");
      });
      (getAnonWorkData as Mock).mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.signUp("test@example.com", "password123")).rejects.toThrow("Database error");
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle null anonymous work data", async () => {
      const mockProjects = [{ id: "existing-project" }];

      (signInAction as Mock).mockResolvedValue({ success: true });
      (getAnonWorkData as Mock).mockReturnValue(null);
      (getProjects as Mock).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(createProject).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-project");
    });

    it("should handle empty projects list after successful auth", async () => {
      const mockNewProject = { id: "fallback-project" };

      (signInAction as Mock).mockResolvedValue({ success: true });
      (getAnonWorkData as Mock).mockReturnValue(null);
      (getProjects as Mock).mockResolvedValue([]);
      (createProject as Mock).mockResolvedValue(mockNewProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/fallback-project");
    });

    it("should ensure loading state is reset even on error", async () => {
      (signInAction as Mock).mockImplementation(() => {
        throw new Error("Network error");
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.signIn("test@example.com", "password123")).rejects.toThrow("Network error");
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should generate unique project names with random numbers", async () => {
      const mockNewProject = { id: "random-project" };

      (signUpAction as Mock).mockResolvedValue({ success: true });
      (getAnonWorkData as Mock).mockReturnValue(null);
      (getProjects as Mock).mockResolvedValue([]);
      (createProject as Mock).mockResolvedValue(mockNewProject);

      // Mock Math.random to return a specific value
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.12345);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("test@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: "New Design #12345",
        messages: [],
        data: {},
      });

      // Restore original Math.random
      Math.random = originalRandom;
    });

    it("should create project name with current time for anonymous work", async () => {
      const mockAnonWork = {
        messages: [{ role: "user", content: "test" }],
        fileSystemData: {},
      };
      const mockProject = { id: "time-project" };

      (signInAction as Mock).mockResolvedValue({ success: true });
      (getAnonWorkData as Mock).mockReturnValue(mockAnonWork);
      (createProject as Mock).mockResolvedValue(mockProject);

      // Mock Date to return consistent time
      const mockDate = new Date("2023-10-15T10:30:45Z");
      vi.setSystemTime(mockDate);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: mockAnonWork.messages,
        data: mockAnonWork.fileSystemData,
      });

      vi.useRealTimers();
    });
  });
});