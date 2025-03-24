import type { ElectronApplication, Page } from "playwright";
import { _electron as electron } from "playwright";
import { setTimeout } from "timers/promises";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext } from "./tools/common/types.js";
import { ScreenshotTool, ConsoleLogsTool, ClickTool } from "./tools/lens/index.js";
import { TOOLS } from "./tools.js";

// Global state
let electronApp: ElectronApplication | undefined;
let page: Page | undefined;

/**
 * Resets Lens Desktop and page variables
 * Used when browser is closed
 */
export function resetState() {
  electronApp = undefined;
  page = undefined;
}

// Tool instances
let screenshotTool: ScreenshotTool;
let consoleLogsTool: ConsoleLogsTool;
let clickTool: ClickTool;

/**
 * Ensures a Lens Desktop instance is launched and returns the page
 */
async function ensureLensDesktop() {
  try {
    // Launch new Lens Desktop if needed
    if (!electronApp) {
      console.info("Launching new Lens Desktop instance...");

      electronApp = await electron.launch({
        executablePath: "/Applications/Lens.app/Contents/MacOS/Lens",
      });

      // launch screen
      await electronApp.firstWindow();

      electronApp.on("close", () => {
        console.error("Lens Desktop close event triggered");
        electronApp = undefined;
        page = undefined;
      });

      // Wait for Lens Desktop to be ready
      await setTimeout(5000);

      page = electronApp.windows()[0];

      // Register console message handler to renderer
      page.on("console", (msg) => {
        if (consoleLogsTool) {
          consoleLogsTool.registerConsoleMessage(msg.type(), msg.text());
        }
      });
    }

    // Verify page is still valid
    if (!page || page.isClosed()) {
      page = electronApp.windows()[0];

      // Re-register console message handler
      page.on("console", (msg) => {
        if (consoleLogsTool) {
          consoleLogsTool.registerConsoleMessage(msg.type(), msg.text());
        }
      });
    }

    return page;
  } catch (error) {
    console.error("Error ensuring browser:", error);
    // If something went wrong, clean up completely and retry once
    try {
      if (electronApp) {
        await electronApp.close().catch(() => {});
      }
    } catch (e) {
      // Ignore errors during cleanup
    }

    resetState();

    electronApp = await electron.launch({
      executablePath: "/Applications/Lens.app/Contents/MacOS/Lens",
    });

    // launch screen
    await electronApp.firstWindow();

    electronApp.on("close", () => {
      console.error("Lens Desktop close event triggered");
      electronApp = undefined;
      page = undefined;
    });

    page = electronApp.windows()[0];

    // Register console message handler to renderer
    page.on("console", (msg) => {
      if (consoleLogsTool) {
        consoleLogsTool.registerConsoleMessage(msg.type(), msg.text());
      }
    });

    return page;
  }
}

/**
 * Initialize all tool instances
 */
function initializeTools(server: any) {
  if (!screenshotTool) screenshotTool = new ScreenshotTool(server);
  if (!consoleLogsTool) consoleLogsTool = new ConsoleLogsTool(server);
  if (!clickTool) clickTool = new ClickTool(server);
}

/**
 * Main handler for tool calls
 */
export async function handleToolCall(
  name: string,
  args: any,
  server: any
): Promise<CallToolResult> {
  // Initialize tools
  initializeTools(server);

  // Special case for browser close to ensure it always works
  if (name === "lens_desktop_close") {
    if (electronApp) {
      try {
        if (electronApp) {
          await electronApp
            .close()
            .catch((e) => console.error("Error closing Lens Desktop:", e));
        }
      } catch (error) {
        console.error("Error during Lens Desktop close in handler:", error);
      } finally {
        resetState();
      }
      return {
        content: [
          {
            type: "text",
            text: "Browser closed successfully",
          },
        ],
        isError: false,
      };
    }
    return {
      content: [
        {
          type: "text",
          text: "No browser instance to close",
        },
      ],
      isError: false,
    };
  }

  // Prepare context based on tool requirements
  const context: ToolContext = {
    server,
  };

  // Set up browser if needed
  if (TOOLS.includes(name)) {
    try {
      context.page = await ensureLensDesktop();
      context.electronApp = electronApp;
    } catch (error) {
      console.error("Failed to ensure browser:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to initialize browser: ${
              (error as Error).message
            }. Please try again.`,
          },
        ],
        isError: true,
      };
    }
  }

  // Route to appropriate tool
  try {
    switch (name) {
      case "lens_desktop_screenshot":
        return await screenshotTool.execute(args, context);
      case "lens_desktop_console_logs":
        return await consoleLogsTool.execute(args);
      case "lens_desktop_click":
        return await clickTool.execute(args, context);

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);

    // Check if it's a browser connection error
    const errorMessage = (error as Error).message;
    if (
      TOOLS.includes(name) &&
      (errorMessage.includes(
        "Target page, context or browser has been closed"
      ) ||
        errorMessage.includes("Browser has been disconnected") ||
        errorMessage.includes("Target closed") ||
        errorMessage.includes("Protocol error"))
    ) {
      // Reset browser state if it's a connection issue
      resetState();
      return {
        content: [
          {
            type: "text",
            text: `Lens Desktop connection error: ${errorMessage}. Lens Desktop state has been reset, please try again.`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Tool execution error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Get console logs
 */
export function getConsoleLogs(): string[] {
  return consoleLogsTool?.getConsoleLogs() ?? [];
}

/**
 * Get screenshots
 */
export function getScreenshots(): Map<string, string> {
  return screenshotTool?.getScreenshots() ?? new Map();
}
