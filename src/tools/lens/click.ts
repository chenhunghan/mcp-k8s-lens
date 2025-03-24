import { createSuccessResponse, ToolResponse } from "../common/response";
import { ToolContext } from "../common/types";
import { BrowserToolBase } from "./base";

/**
 * Tool for clicking elements on the page
 */
export class ClickTool extends BrowserToolBase {
  /**
   * Execute the click tool
   */
  async execute(args: { selector: string }, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      await page.click(args.selector);
      return createSuccessResponse(`Clicked element: ${args.selector}`);
    });
  }
}