import { tool } from "ai";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { generateText } from "ai";

import { getActiveModelRuntime } from "@/features/models/provider";
import { ensureSkillStorage } from "@/features/skills/registry";
import { dataPaths } from "@/lib/data-paths";

const SKILLS_BASE_DIR = dataPaths.agentHubSkills;

// 独立的业务生成函数，可被其他后端 API 或工具导入调用
export async function generateSkillFlowMermaid(skillId: string): Promise<string> {
  ensureSkillStorage();
  const targetDir = path.resolve(SKILLS_BASE_DIR, skillId);
  const markdownPath = path.join(targetDir, "SKILL.md");
  const mermaidPath = path.join(targetDir, "flow.mermaid");

  // 确认 SKILL.md 是否存在
  try {
    await fs.access(markdownPath);
  } catch {
    throw new Error(`未找到技能核心指令文件 (SKILL.md)，路径: ${markdownPath}`);
  }

  const skillMarkdown = await fs.readFile(markdownPath, "utf8");

  // 调用大模型分析生成 Mermaid 流程图
  const modelRuntime = getActiveModelRuntime();
  const prompt = [
    "你是一个系统编排与逻辑可视化专家。请深入阅读以下 AI 技能的编排执行核心指令 (SKILL.md)，分析其包含的操作步骤、条件分支（如判断参数是否齐备）、工具调用以及输出格式，并将其整理成一张美观、逻辑严密的 Mermaid 流程图 (Flowchart)。",
    "",
    "规则要求：",
    "1. 必须使用 `flowchart LR` (从左至右) 定义图表结构。",
    "2. 【重要】为了防止 Mermaid 解析特殊字符（如问号、括号、点号、斜杠等）出错，所有节点和判断框内的文本标签必须使用双引号包围。例如：A[\"接收原始文本\"]、B{\"是否包含CAD文件? ( .dwg/.dxf 或上传语句)\"}。绝对不要直接在没有双引号的节点中写入任何包含特殊字符的内容。",
    "3. 节点内的描述必须简明扼要，控制在 20 字以内。",
    "4. 如果执行过程中有工具调用，用特定的流程分支标注该步骤。",
    "5. 你必须【仅输出纯 Mermaid 格式的代码】，绝对不要包裹 ```mermaid 或 ``` 代码块标记，不要添加任何 Markdown 格式，不要包含任何前言、后记或额外的解释性文字。必须使输出能够被直接作为 Mermaid 代码进行渲染。",
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

  const rawText = result.text.trim();
  
  // 提取干净的 Mermaid 代码，防止模型返回多余代码块包裹
  const match = rawText.match(/```mermaid\s*([\s\S]*?)\s*```/) || rawText.match(/```\s*([\s\S]*?)\s*```/);
  const cleanedMermaid = match ? match[1].trim() : rawText;

  // 写入本地 flow.mermaid 文本文件进行持久化
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(mermaidPath, cleanedMermaid, "utf8");

  return cleanedMermaid;
}

// 封装为大模型可调用的 AI Tool
export const skillsFlowTool = tool({
  description: "根据指定技能的核心执行指令(SKILL.md)自动分析并生成对应的 Mermaid 流程图并写入本地系统。",
  inputSchema: z.object({
    skillId: z.string().regex(/^[a-z0-9-]+$/).describe("需要分析流程图的技能ID"),
  }),
  execute: async ({ skillId }) => {
    try {
      const targetDir = path.resolve(SKILLS_BASE_DIR, skillId);
      
      // 安全检查，防路径遍历
      if (!targetDir.startsWith(SKILLS_BASE_DIR)) {
        return {
          ok: false,
          toolId: "skills_flow",
          error: "非法操作路径",
        };
      }

      const flowMermaid = await generateSkillFlowMermaid(skillId);

      return {
        ok: true,
        toolId: "skills_flow",
        message: `成功为技能 ${skillId} 生成/更新流程图。`,
        data: {
          skillId,
          flowMermaid,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "未知错误";
      return {
        ok: false,
        toolId: "skills_flow",
        error: `分析生成流程图失败: ${errorMsg}`,
      };
    }
  },
});
