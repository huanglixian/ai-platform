import { z } from "zod";

import {
  CapabilityExecutionError,
  invokeCapability,
} from "@/features/capabilities/execution";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

const invokeRequestSchema = z.object({
  input: z.unknown(),
  dryRun: z.boolean().default(false),
  timeoutMs: z.number().int().min(100).max(30_000).default(10_000),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = invokeRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("调用参数格式错误", 422, parsed.error.flatten());
  }

  const { id } = await context.params;
  try {
    const result = await invokeCapability(id, parsed.data.input, {
      dryRun: parsed.data.dryRun,
      timeoutMs: parsed.data.timeoutMs,
    });
    if (
      !parsed.data.dryRun &&
      result.result &&
      typeof result.result === "object" &&
      "success" in result.result &&
      result.result.success === false
    ) {
      return apiError("外部能力调用失败", 502, result.result);
    }
    return apiOk(result);
  } catch (error) {
    if (error instanceof CapabilityExecutionError) {
      return apiError(error.message, error.status, error.details);
    }
    return apiError(error instanceof Error ? error.message : "能力调用失败", 500);
  }
}
