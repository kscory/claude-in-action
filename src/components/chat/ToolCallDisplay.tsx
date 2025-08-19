import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: any;
  state: "partial" | "result";
  result?: string;
}

interface ToolCallDisplayProps {
  tool: ToolInvocation;
}

function generateToolMessage(toolName: string, args: any): string {
  switch (toolName) {
    case "str_replace_editor":
      const { command, path } = args;
      const fileName = path ? path.split("/").pop() : "file";
      
      switch (command) {
        case "create":
          return `Creating file ${fileName}`;
        case "str_replace":
          return `Editing ${fileName}`;
        case "view":
          return `Viewing ${fileName}`;
        case "insert":
          return `Adding content to ${fileName}`;
        case "undo_edit":
          return `Undoing changes in ${fileName}`;
        default:
          return `Modifying ${fileName}`;
      }
      
    case "file_manager":
      const { operation, path: filePath, new_path, old_path } = args;
      
      switch (operation) {
        case "rename":
          const oldName = old_path ? old_path.split("/").pop() : "file";
          const newName = new_path ? new_path.split("/").pop() : "file";
          return `Renaming ${oldName} to ${newName}`;
        case "delete":
          const deleteFileName = filePath ? filePath.split("/").pop() : "file";
          return `Deleting ${deleteFileName}`;
        case "create_directory":
          const dirName = filePath ? filePath.split("/").pop() : "directory";
          return `Creating directory ${dirName}`;
        case "move":
          const moveFileName = (old_path || filePath) ? (old_path || filePath).split("/").pop() : "file";
          return `Moving ${moveFileName}`;
        case "copy":
          const copyFileName = (old_path || filePath) ? (old_path || filePath).split("/").pop() : "file";
          return `Copying ${copyFileName}`;
        default:
          return `Managing files`;
      }
      
    default:
      return toolName.replace(/_/g, " ");
  }
}

export function ToolCallDisplay({ tool }: ToolCallDisplayProps) {
  const message = generateToolMessage(tool.toolName, tool.args);
  const isCompleted = tool.state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isCompleted ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{message}</span>
    </div>
  );
}