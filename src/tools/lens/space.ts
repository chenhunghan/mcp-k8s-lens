import fs from "node:fs";
import * as path from "node:path";
import { BrowserToolBase } from "./base.js";
import { ToolContext, ToolResponse } from "../common/types.js";
import { createSuccessResponse } from "../common/response.js";

/**
 * Tool for taking screenshots of pages or elements
 */
export class SpaceTool extends BrowserToolBase {
  /**
   * Execute the screenshot tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {

      if (args.spaceName) {
        const space = await page.evaluate(async ({ spaceName }) => {
          return await global.LensExtensions.Renderer.Space.getSpace({ name: spaceName })
        }, {
          spaceName: args.spaceName,
        });

        const messages = [
          `Found space \`\`\`json${JSON.stringify(space)}\`\`\``,
        ];

        return createSuccessResponse(messages);
      }

      const spaces = await page.evaluate(async () => {
        const spaces = await global.LensExtensions.Renderer.Space.getManySpaces("")
        return spaces;
      });

      const messages = [
        `List of Lens Spaces \`\`\`json${JSON.stringify(spaces)}\`\`\``,
      ];

      return createSuccessResponse(messages);
    });
  }
}
