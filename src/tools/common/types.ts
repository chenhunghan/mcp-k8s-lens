import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type {
  CallToolResult,
  TextContent,
  ImageContent,
} from "@modelcontextprotocol/sdk/types.js";
import type { Page, ElectronApplication } from "playwright";

// Context for tool execution
export interface ToolContext {
  page?: Page;
  electronApp?: ElectronApplication;
  server?: Server;
}

// Standard response format for all tools
export interface ToolResponse extends CallToolResult {
  content: (TextContent | ImageContent)[];
  isError: boolean;
}

// Interface that all tool implementations must follow
export interface ToolHandler {
  execute(args: any, context: ToolContext): Promise<ToolResponse>;
}
