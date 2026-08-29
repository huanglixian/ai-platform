import { getCapabilityImplementation } from "@/features/capabilities/implementation-registry";
import { getCapability } from "@/features/capabilities/server";

type ValidationResult =
  | { success: true; data: unknown }
  | { success: false; error: { flatten(): unknown } };

type ExecutableImplementation = {
  inputSchema: { safeParse(input: unknown): ValidationResult };
  execute?: (
    input: unknown,
    options: { toolCallId: string; messages: never[]; abortSignal: AbortSignal },
  ) => unknown;
};

export class CapabilityExecutionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export async function invokeCapability(
  capabilityId: string,
  input: unknown,
  options: { dryRun?: boolean; timeoutMs?: number } = {},
) {
  const capability = getCapability(capabilityId);
  if (!capability) throw new CapabilityExecutionError("能力不存在", 404);
  if (capability.status !== "active") {
    throw new CapabilityExecutionError("能力已禁用", 409);
  }
  if (capability.availability !== "available") {
    throw new CapabilityExecutionError("能力当前不可用", 503);
  }
  if (!capability.handlerKey) {
    throw new CapabilityExecutionError("能力未配置执行 handler", 501);
  }

  const implementation = getCapabilityImplementation(capability.handlerKey) as
    | ExecutableImplementation
    | undefined;
  if (!implementation) {
    throw new CapabilityExecutionError(`未找到 handler：${capability.handlerKey}`, 501);
  }

  const parsed = implementation.inputSchema.safeParse(input);
  if (!parsed.success) {
    throw new CapabilityExecutionError("能力参数校验失败", 422, parsed.error.flatten());
  }
  if (options.dryRun) {
    return { capabilityId, handlerKey: capability.handlerKey, valid: true };
  }
  if (!implementation.execute) {
    throw new CapabilityExecutionError("能力不支持服务端直接调用", 405);
  }

  const timeoutMs = options.timeoutMs ?? 10_000;
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      Promise.resolve(
        implementation.execute(parsed.data, {
          toolCallId: crypto.randomUUID(),
          messages: [],
          abortSignal: controller.signal,
        }),
      ),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new CapabilityExecutionError(`能力调用超时（${timeoutMs}ms）`, 504));
        }, timeoutMs);
      }),
    ]);
    return { capabilityId, handlerKey: capability.handlerKey, result };
  } catch (error) {
    if (error instanceof CapabilityExecutionError) throw error;
    throw new CapabilityExecutionError(
      error instanceof Error ? error.message : "能力调用失败",
      502,
    );
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
