#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createToolDefinitions } from "./tools";
import { setupRequestHandlers } from "./requestHandler";

async function run() {
  const server = new Server(
    {
      name: "K8s Lens service",
      version: "0.0.1",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  const TOOLS = createToolDefinitions();
  setupRequestHandlers(server, TOOLS);

  // Create transport and connect
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
