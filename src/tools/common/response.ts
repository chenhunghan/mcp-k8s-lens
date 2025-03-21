import type { CallToolResult, TextContent, ImageContent } from '@modelcontextprotocol/sdk/types.js';

export interface ToolResponse extends CallToolResult {
  content: (TextContent | ImageContent)[];
  isError: boolean;
}

// Helper functions for creating responses
export function createErrorResponse(message: string): ToolResponse {
  return {
    content: [{
      type: "text",
      text: message
    }],
    isError: true
  };
}

export function createSuccessResponse(message: string | string[]): ToolResponse {
  const messages = Array.isArray(message) ? message : [message];
  return {
    content: messages.map(msg => ({
      type: "text",
      text: msg
    })),
    isError: false
  };
} 