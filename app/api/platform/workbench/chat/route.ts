import { NextRequest, NextResponse } from "next/server";
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
    const result = streamWorkbenchRecommendation(payload.messages);

    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-store",
      },
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
