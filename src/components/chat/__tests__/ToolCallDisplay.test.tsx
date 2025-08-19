import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallDisplay } from "../ToolCallDisplay";

// Mock the Loader2 component
vi.mock("lucide-react", () => ({
  Loader2: ({ className }: { className: string }) => (
    <div className={className} data-testid="loader">Loading</div>
  ),
}));

afterEach(() => {
  cleanup();
});

// Test str_replace_editor tool
test("displays create command message", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/components/Button.tsx" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Creating file Button.tsx")).toBeDefined();
});

test("displays str_replace command message", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/src/App.jsx" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("displays view command message", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "view", path: "/src/utils/helper.ts" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Viewing helper.ts")).toBeDefined();
});

test("displays insert command message", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "insert", path: "/src/index.js" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Adding content to index.js")).toBeDefined();
});

test("displays undo_edit command message", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "undo_edit", path: "/src/component.tsx" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Undoing changes in component.tsx")).toBeDefined();
});

test("displays default message for unknown str_replace_editor command", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "unknown", path: "/src/test.js" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Modifying test.js")).toBeDefined();
});

// Test file_manager tool
test("displays rename operation message", () => {
  const tool = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { operation: "rename", old_path: "/src/OldComponent.tsx", new_path: "/src/NewComponent.tsx" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Renaming OldComponent.tsx to NewComponent.tsx")).toBeDefined();
});

test("displays delete operation message", () => {
  const tool = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { operation: "delete", path: "/src/unused.js" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Deleting unused.js")).toBeDefined();
});

test("displays create_directory operation message", () => {
  const tool = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { operation: "create_directory", path: "/src/components" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Creating directory components")).toBeDefined();
});

test("displays move operation message", () => {
  const tool = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { operation: "move", old_path: "/src/temp.js" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Moving temp.js")).toBeDefined();
});

test("displays copy operation message", () => {
  const tool = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { operation: "copy", old_path: "/src/template.tsx" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Copying template.tsx")).toBeDefined();
});

test("displays default message for unknown file_manager operation", () => {
  const tool = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { operation: "unknown" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Managing files")).toBeDefined();
});

// Test unknown tool
test("displays formatted tool name for unknown tool", () => {
  const tool = {
    toolCallId: "1",
    toolName: "custom_tool_name",
    args: {},
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("custom tool name")).toBeDefined();
});

// Test states
test("shows completed state with green dot", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/App.tsx" },
    state: "result" as const,
    result: "Success",
  };

  const { container } = render(<ToolCallDisplay tool={tool} />);
  
  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).toBeDefined();
  expect(screen.queryByTestId("loader")).toBeNull();
});

test("shows loading state with spinner", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/App.tsx" },
    state: "partial" as const,
  };

  const { container } = render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByTestId("loader")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

// Test edge cases
test("handles missing path gracefully", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Creating file file")).toBeDefined();
});

test("handles missing args gracefully", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: {},
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Modifying file")).toBeDefined();
});

test("handles file_manager with missing paths gracefully", () => {
  const tool = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { operation: "rename" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Renaming file to file")).toBeDefined();
});

test("extracts filename from nested paths", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/very/deep/nested/path/component.tsx" },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolCallDisplay tool={tool} />);
  
  expect(screen.getByText("Creating file component.tsx")).toBeDefined();
});

test("applies correct CSS classes", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/App.tsx" },
    state: "result" as const,
    result: "Success",
  };

  const { container } = render(<ToolCallDisplay tool={tool} />);
  
  const wrapper = container.firstChild as HTMLElement;
  expect(wrapper.className).toContain("inline-flex");
  expect(wrapper.className).toContain("items-center");
  expect(wrapper.className).toContain("gap-2");
  expect(wrapper.className).toContain("bg-neutral-50");
  expect(wrapper.className).toContain("rounded-lg");
  expect(wrapper.className).toContain("border-neutral-200");
});