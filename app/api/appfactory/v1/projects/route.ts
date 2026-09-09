import { z } from "zod";

import { createProject, listProjects } from "@/app_factory/server/database";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  skillProfile: z.string().trim().max(80).optional(),
});

export function GET() {
  return apiOk(listProjects());
}

export async function POST(request: Request) {
  const input = schema.safeParse(await request.json());
  if (!input.success) return apiError("项目字段校验失败", 422, input.error.flatten());
  return apiOk(createProject(input.data), { status: 201 });
}
