import { z } from "zod";

import type { SkillDefinition } from "@/features/skills/skill-types";

const inputSchema = z.object({
  taskName: z.string().min(2, "任务名称不能为空"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
});

export const enterpriseTaskSkill: SkillDefinition<
  z.infer<typeof inputSchema>,
  {
    taskId: string;
    status: string;
    priority: string;
    assignee: string;
    note: string;
  }
> = {
  id: "mock-enterprise-task",
  name: "模拟企业任务处理",
  description: "模拟创建企业任务，返回任务编号、负责人、优先级和处理状态。",
  category: "业务辅助",
  emoji: "✅",
  featured: false,
  enabled: true,
  owner: "平台内置",
  riskLevel: "medium",
  invokeType: "Skill",
  calls: "0",
  tags: ["任务处理", "业务流程", "模拟执行"],
  useCases: ["企业流程验证", "任务派发模拟", "技能执行链路测试"],
  inputFields: [
    {
      name: "taskName",
      label: "任务名称",
      type: "string",
      required: true,
      description: "需要模拟处理的任务名称。",
    },
    {
      name: "priority",
      label: "优先级",
      type: "string",
      required: false,
      description: "low、medium 或 high，默认 medium。",
    },
    {
      name: "assignee",
      label: "负责人",
      type: "string",
      required: false,
      description: "模拟任务负责人。",
    },
    {
      name: "dueDate",
      label: "截止时间",
      type: "string",
      required: false,
      description: "可选截止日期文本。",
    },
  ],
  outputDescription: "返回模拟任务编号、状态、负责人和说明。",
  callGuide: "适合验证企业任务类技能的参数校验、执行和返回链路。",
  inputSchema,
  execute(input, context) {
    return {
      taskId: `TASK-${context.requestId.slice(-8).toUpperCase()}`,
      status: "已模拟创建",
      priority: input.priority,
      assignee: input.assignee || "未指定",
      note: input.dueDate
        ? `任务「${input.taskName}」已登记，截止时间为 ${input.dueDate}。`
        : `任务「${input.taskName}」已登记。`,
    };
  },
};
