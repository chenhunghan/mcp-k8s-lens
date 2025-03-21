import { experimental_createMCPClient, generateText, } from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { openai } from "@ai-sdk/openai";

let mcpClient;

try {
  const transport = new Experimental_StdioMCPTransport({
    command: "tsx",
    args: ["src/index.ts"],
  });
  mcpClient = await experimental_createMCPClient({
    transport,
  });

  const tools = await mcpClient.tools();
  console.log(tools);

  const response = await generateText({
    model: openai("gpt-4o-mini"),
    tools,
    toolChoice: "required",
    messages: [
      {
        role: "user",
        content: "Open Lens Desktop, tell me what you see from the logs",
      },
    ],
  });

  for (const toolResult of response.toolResults) {
    console.log(toolResult.result.content);
  }

  // typed tool calls:
  for (const toolCall of response.toolCalls) {
    console.log(toolCall);
  }

  console.log("????", response.text);
} catch (error) {
  console.error(error);
} finally {
  await Promise.all([mcpClient.close()]);
}
