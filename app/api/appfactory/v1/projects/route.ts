import { withApiAuth } from "@/features/auth/api";
import { z } from "zod";

import { createProject, listProjects } from "@/app_factory/server/database";
import { isAppTemplateId } from "@/app_factory/template-catalog";
import type { AppTemplateId } from "@/app_factory/template-catalog";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  templateId: z.string().trim().refine(isAppTemplateId, "项目模板不存在"),
});

function handleGET() {
  return apiOk(listProjects());
}

async function handlePOST(request: Request) {
  const input = schema.safeParse(await request.json());
  if (!input.success) return apiError("项目字段校验失败", 422, input.error.flatten());
  return apiOk(
    createProject({ ...input.data, templateId: input.data.templateId as AppTemplateId }),
    { status: 201 },
  );
}

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);
