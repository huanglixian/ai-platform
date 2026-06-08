import { Workflow } from "./types";

/**
 * 默认初始业务流数据
 */
export const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: "workflow-safety-check",
    name: "高压杆塔安全分析工作流",
    description: "编排图像匹配 API 与技能分析包，对输入的高压杆塔图像进行全链路破损检测。",
    createdAt: "2026-06-08T10:00:00Z",
    updatedAt: "2026-06-08T12:00:00Z",
    nodes: [
      {
        id: "node-start",
        type: "start",
        position: { x: 50, y: 150 },
        data: {
          label: "开始节点",
          description: "接收待检测杆塔图像路径",
          config: { prompt: "输入高压杆塔现场拍摄照片" }
        }
      },
      {
        id: "node-api",
        type: "service",
        position: { x: 280, y: 150 },
        data: {
          label: "杆塔检测API",
          description: "调用后台 tower-match 工具识别杆塔结构",
          config: { serviceId: "tower-match" }
        }
      },
      {
        id: "node-skill",
        type: "skill",
        position: { x: 520, y: 150 },
        data: {
          label: "缺陷诊断技能",
          description: "提取比对特征，诊断裂纹及螺栓脱落风险",
          config: { skillId: "safety-expert" }
        }
      },
      {
        id: "node-end",
        type: "end",
        position: { x: 760, y: 150 },
        data: {
          label: "结束节点",
          description: "输出结构化隐患排查报告",
          config: {}
        }
      }
    ],
    edges: [
      { id: "e1-2", source: "node-start", target: "node-api" },
      { id: "e2-3", source: "node-api", target: "node-skill" },
      { id: "e3-4", source: "node-skill", target: "node-end" }
    ]
  }
];

/**
 * 获取本地缓存中的工作流列表，带有 try-catch 健壮性保护
 */
export function getLocalWorkflows(): Workflow[] {
  if (typeof window === "undefined") return INITIAL_WORKFLOWS;
  const stored = localStorage.getItem("ai_platform_workflows");
  if (!stored) {
    localStorage.setItem("ai_platform_workflows", JSON.stringify(INITIAL_WORKFLOWS));
    return INITIAL_WORKFLOWS;
  }
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse local workflows, resetting to initial state:", error);
    localStorage.setItem("ai_platform_workflows", JSON.stringify(INITIAL_WORKFLOWS));
    return INITIAL_WORKFLOWS;
  }
}

/**
 * 保存工作流列表到本地缓存
 */
export function saveLocalWorkflows(list: Workflow[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("ai_platform_workflows", JSON.stringify(list));
}
