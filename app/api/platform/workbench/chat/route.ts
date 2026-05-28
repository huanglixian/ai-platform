import { NextRequest, NextResponse } from "next/server";
import { createTextStreamResponse } from "ai";
import { z } from "zod";

import { streamWorkbenchRecommendation } from "@/features/workbench/chat-service";

const chatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const payload = chatRequestSchema.parse(await request.json());
    const result = await streamWorkbenchRecommendation(payload.messages);
    const headers = {
      "Cache-Control": "no-store",
    };

    const responseStream = new ReadableStream<string>({
      async start(controller) {
        if (result.skillName) {
          controller.enqueue(`调用技能：${result.skillName}\n\n`);
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
              const resultVal = (chunk as any).result ?? (chunk as any).output;
              controller.enqueue(`\n\n[RESULT_TOOL:{"name":"${toolName}","result":${JSON.stringify(resultVal)}}]\n\n`);
            }
          }
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
    const message = error instanceof Error ? error.message : "工作台 AI 回复失败";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 },
    );
  }
}
