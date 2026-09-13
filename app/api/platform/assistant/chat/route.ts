import { NextRequest, NextResponse } from "next/server";
import { createTextStreamResponse } from "ai";
import { z } from "zod";

import { streamAssistantResponse } from "@/features/assistant/chat-service";

const chatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
  runtimeState: z.object({
    activeSkillId: z.string().optional(),
    skillStatus: z.enum(["idle", "collecting_input", "running_tool", "completed", "failed"]).optional(),
    startedAtMessageIndex: z.number().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = chatRequestSchema.parse(await request.json());
    const result = await streamAssistantResponse(payload.messages, payload.runtimeState);
    const headers = {
      "Cache-Control": "no-store",
    };

    const responseStream = new ReadableStream<string>({
      async start(controller) {
        if (result.skillName) {
          controller.enqueue(`调用技能：${result.skillName}\n\n`);
        }

        // 初始化本轮最终的 runtimeState，继承自上一轮
        let currentRuntimeState = payload.runtimeState
          ? { ...payload.runtimeState }
          : { skillStatus: "idle" as const };

        // 如果新命中了需要锁定会话的技能，且尚未在会话中
        if (result.activeSkillId && result.requiresSession) {
          if (currentRuntimeState.activeSkillId !== result.activeSkillId) {
            currentRuntimeState = {
              activeSkillId: result.activeSkillId,
              skillStatus: "collecting_input",
              startedAtMessageIndex: payload.messages.length - 1, // 技能触发的那条消息的索引
            };
          }
        }

        try {
          for await (const chunk of result.stream.fullStream) {
            if (chunk.type === "text-delta") {
              controller.enqueue(chunk.text);
            } else if (chunk.type === "tool-call") {
              const toolName = chunk.toolName.replace(/_/g, ".");
              controller.enqueue(`\n\n[CALL_TOOL:{"name":"${toolName}","args":${JSON.stringify(chunk.input)}}]\n\n`);
            } else if (chunk.type === "tool-result") {
              const toolName = chunk.toolName.replace(/_/g, ".");
              const resultChunk = chunk as { result?: unknown; output?: unknown };
              const resultVal = resultChunk.result ?? resultChunk.output;
              controller.enqueue(`\n\n[RESULT_TOOL:{"name":"${toolName}","result":${JSON.stringify(resultVal)}}]\n\n`);

              // 检查调用的工具是否是当前技能的完成工具（completionTools）
              const originalToolName = chunk.toolName; // 如 "create_skill"
              const completionTools = result.completionTools || [];
              if (
                result.activeSkillId &&
                (completionTools.includes(originalToolName) || completionTools.includes(toolName))
              ) {
                const resultRecord = typeof resultVal === "object" && resultVal !== null ? resultVal as Record<string, unknown> : {};
                const isOk = resultRecord.ok === true || resultRecord.success === true;
                if (isOk) {
                  currentRuntimeState = {
                    activeSkillId: undefined,
                    skillStatus: "completed",
                    startedAtMessageIndex: undefined,
                  };
                } else {
                  currentRuntimeState = {
                    activeSkillId: undefined,
                    skillStatus: "failed",
                    startedAtMessageIndex: undefined,
                  };
                }
              }
            }
          }

          // 将最新的 runtimeState 序列化为结构化标签追加在流末尾，供前端解析
          controller.enqueue(`\n\n[__STATE__:${JSON.stringify(currentRuntimeState)}]\n\n`);

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return createTextStreamResponse({
      headers,
      textStream: responseStream,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 助手回复失败";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 },
    );
  }
}
