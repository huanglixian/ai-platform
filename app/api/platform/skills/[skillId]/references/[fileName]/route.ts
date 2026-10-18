import { withApiAuth } from "@/features/auth/api";
import { getSkillById } from "@/features/skills/registry";

export const runtime = "nodejs";

type ReferenceRouteContext = {
  params: Promise<{ skillId: string; fileName: string }>;
};

async function handleGET(_request: Request, context: ReferenceRouteContext) {
  const { skillId, fileName } = await context.params;
  const skill = getSkillById(skillId);
  const reference = skill?.referenceFiles.find((file) => file.name === `references/${fileName}`);

  if (!reference) {
    return Response.json({ ok: false, error: "未找到对应参考文件" }, { status: 404 });
  }

  return new Response(reference.content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const GET = withApiAuth(handleGET);
