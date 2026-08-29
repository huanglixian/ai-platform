import { tool } from "ai";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { generateSkillFlowMermaid } from "./skills-flow";

// 技能存储的基础目录路径
const SKILLS_BASE_DIR = path.resolve(process.cwd(), "storage/agenthub/skills");

export const createSkillTool = tool({
  description: "自动在系统的技能存储目录(storage/agenthub/skills)中创建一个新的配置型技能包。必须提供技能ID、名称、描述、分类、触发词以及编排指令SKILL.md内容。",
  inputSchema: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/).describe("技能唯一标识，仅限小写英文、数字和短横线，例如：meeting-notes"),
    name: z.string().describe("技能名称，在页面上展示，例如：会议纪要助手"),
    description: z.string().describe("技能一句话简短描述"),
    category: z.enum(["办公技能", "业务技能"]).describe("技能所属分类，这里我们建议用 办公技能 或 业务技能"),
    triggers: z.array(z.string()).min(1).describe("触发语句数组，至少3个，例如：['生成周报', '整理周报', '写个周报']"),
    skillMdContent: z.string().describe("技能执行的核心指令SKILL.md中的Markdown纯文本内容"),
    allowedTools: z.array(z.string()).optional().describe("允许调用的工具列表，例如：['tower.match.search']"),
    requiresSession: z.boolean().optional().describe("是否需要多轮会话锁定状态。如果需要调用工具或多步确认，请传 true"),
    completionTools: z.array(z.string()).optional().describe("会话结束工具标识列表，例如：['tower.match.search']")
  }),
  execute: async ({ id, name, description, category, triggers, skillMdContent, allowedTools, requiresSession, completionTools }) => {
    try {
      const targetDir = path.resolve(SKILLS_BASE_DIR, id);
      
      // 安全检查：确保写入的目录确实在技能存储目录范围内，防止路径遍历攻击
      if (!targetDir.startsWith(SKILLS_BASE_DIR)) {
        return {
          ok: false,
          toolId: "create_skill",
          error: "非法写入路径，技能ID包含非法字符。"
        };
      }

      // 确保目标文件夹存在
      await fs.mkdir(targetDir, { recursive: true });

      // 构建 skill.json 内容
      const skillJson = {
        id,
        name,
        description,
        enabled: true,
        category,
        owner: "AI生成",
        triggers,
        allowedTools: allowedTools || [],
        requiresSession: requiresSession || false,
        completionTools: completionTools || []
      };

      // 写入配置文件和编排文件
      await fs.writeFile(path.join(targetDir, "skill.json"), JSON.stringify(skillJson, null, 2), "utf8");
      await fs.writeFile(path.join(targetDir, "SKILL.md"), skillMdContent, "utf8");

      // 异步在后台生成该技能的流程图，不阻塞工具响应
      void generateSkillFlowMermaid(id);

      return {
        ok: true,
        toolId: "create_skill",
        message: `成功创建技能 ${name} (${id})！文件已安全写入 storage/agenthub/skills/${id}/。`,
        data: {
          id,
          name,
          dir: `storage/agenthub/skills/${id}/`
        }
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "未知错误";
      return {
        ok: false,
        toolId: "create_skill",
        error: `写入技能文件失败: ${errorMsg}`
      };
    }
  }
});
