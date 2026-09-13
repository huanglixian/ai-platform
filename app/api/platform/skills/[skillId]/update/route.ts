import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { generateSkillFlowMermaid } from "@/features/services/tools/skills-flow";
import { ensureSkillStorage } from "@/features/skills/registry";
import { dataPaths } from "@/lib/data-paths";

const updateSkillSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  enabled: z.boolean(),
  category: z.string().min(1),
  owner: z.string().default("AI生成"),
  triggers: z.array(z.string()).default([]),
  allowedTools: z.array(z.string()).default([]),
  requiresSession: z.boolean().optional(),
  completionTools: z.array(z.string()).optional(),
  skillMarkdown: z.string().min(1),
  referenceFiles: z.array(
    z.object({
      name: z.string(),
      content: z.string(),
    })
  ).default([]),
});

type RouteContext = {
  params: Promise<{
    skillId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { skillId } = await context.params;

  try {
    const payload = updateSkillSchema.parse(await request.json());
    ensureSkillStorage();
    const skillsRoot = dataPaths.agentHubSkills;
    const targetDir = path.resolve(skillsRoot, skillId);

    // 安全检查，防止目录穿越
    if (!targetDir.startsWith(skillsRoot)) {
      return NextResponse.json({ ok: false, error: "非法操作路径" }, { status: 400 });
    }

    const metadataPath = path.join(targetDir, "skill.json");
    const markdownPath = path.join(targetDir, "SKILL.md");

    // 保存元数据
    const skillJson = {
      id: skillId,
      name: payload.name,
      description: payload.description,
      enabled: payload.enabled,
      category: payload.category,
      owner: payload.owner,
      triggers: payload.triggers,
      allowedTools: payload.allowedTools,
      requiresSession: payload.requiresSession,
      completionTools: payload.completionTools,
    };

    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(metadataPath, JSON.stringify(skillJson, null, 2), "utf8");

    // 保存核心执行 Markdown 指令
    await fs.writeFile(markdownPath, payload.skillMarkdown, "utf8");

    // 物理清空已有的 references 目录以彻底移除已删除文件，如果不存在也无妨
    const referencesDir = path.join(targetDir, "references");
    await fs.rm(referencesDir, { recursive: true, force: true });

    if (payload.referenceFiles.length > 0) {
      await fs.mkdir(referencesDir, { recursive: true });
      for (const refFile of payload.referenceFiles) {
        // 安全提取文件名，规避目录穿越风险
        const baseName = path.basename(refFile.name);
        const refPath = path.join(referencesDir, baseName);
        await fs.writeFile(refPath, refFile.content, "utf8");
      }
    }

    // 异步重新生成流程图，不阻塞保存接口的响应
    void generateSkillFlowMermaid(skillId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "保存技能配置失败",
      },
      { status: 400 }
    );
  }
}
