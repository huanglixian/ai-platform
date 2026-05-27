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

function prependTextStream(prefix: string, stream: AsyncIterable<string>) {
  return new ReadableStream<string>({
    async start(controller) {
      controller.enqueue(prefix);

      try {
        for await (const delta of stream) {
          controller.enqueue(delta);
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const payload = chatRequestSchema.parse(await request.json());
    const result = await streamWorkbenchRecommendation(payload.messages);
    const headers = {
      "Cache-Control": "no-store",
    };

    if (result.skillName) {
      return createTextStreamResponse({
        headers,
        textStream: prependTextStream(
          `调用技能：${result.skillName}\n\n`,
          result.stream.textStream,
        ),
      });
    }

    return result.stream.toTextStreamResponse({
      headers,
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
