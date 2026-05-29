import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { generateText } from "ai";

import { getActiveModelRuntime } from "@/features/models/provider";

type RouteContext = {
  params: Promise<{
    skillId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { skillId } = await context.params;

  try {
    const skillsRoot = path.join(process.cwd(), "storage", "platform", "skills");
    const targetDir = path.resolve(skillsRoot, skillId);

    // 安全检查，防止目录穿越
    if (!targetDir.startsWith(skillsRoot)) {
      return NextResponse.json({ ok: false, error: "非法操作路径" }, { status: 400 });
    }

    const markdownPath = path.join(targetDir, "SKILL.md");
    const mermaidPath = path.join(targetDir, "flow.mermaid");

    // 检查 SKILL.md 是否存在
    try {
      await fs.access(markdownPath);
    } catch {
      return NextResponse.json({ ok: false, error: "未找到技能核心指令文件 (SKILL.md)" }, { status: 404 });
    }

    const skillMarkdown = await fs.readFile(markdownPath, "utf8");

    // 调用大模型分析生成 Mermaid 流程图
    const modelRuntime = getActiveModelRuntime();
    const prompt = [
      "你是一个系统编排与逻辑可视化专家。请深入阅读以下 AI 技能的编排执行核心指令 (SKILL.md)，分析其包含的操作步骤、条件分支（如判断参数是否齐备）、工具调用以及输出格式，并将其整理成一张美观、逻辑严密的 Mermaid 流程图 (Flowchart)。",
      "",
      "规则要求：",
      "1. 必须使用 `graph TD` (自上而下) 或 `graph LR` (从左至右) 定义图表结构。",
      "2. 节点内的描述必须简明厄要（如：A[接收原始文本] --> B{判断是否满足倍数?}）。",
      "3. 如果执行过程中有工具调用，用特定的流程分支标注该步骤。",
      "4. 你必须【仅输出纯 Mermaid 格式的代码】，绝对不要包裹 ```mermaid 或 ``` 代码块标记，不要添加任何 Markdown 格式，不要包含任何前言、后记或额外的解释性文字。必须使输出能够被直接作为 Mermaid 代码进行渲染。",
      "",
      "待分析的核心指令内容 (SKILL.md)：",
      skillMarkdown,
    ].join("\n");

    const result = await generateText({
      model: modelRuntime.model,
      prompt,
      temperature: 0.1,
      providerOptions: modelRuntime.providerOptions,
    });

    let rawText = result.text.trim();
    
    // 如果大模型不听话，仍然返回了带代码块标记的文本，通过正则提取出干净的 Mermaid 串
    const match = rawText.match(/```mermaid\s*([\s\S]*?)\s*```/) || rawText.match(/```\s*([\s\S]*?)\s*```/);
    const cleanedMermaid = match ? match[1].trim() : rawText;

    // 持久化写入本地 flow.mermaid
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(mermaidPath, cleanedMermaid, "utf8");

    return NextResponse.json({
      ok: true,
      flowMermaid: cleanedMermaid,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "AI 分析失败",
      },
      { status: 500 }
    );
  }
}
