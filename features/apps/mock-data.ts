import { PublishedApp } from "./types";

export const INITIAL_APPS: PublishedApp[] = [
  {
    id: "app-dify-chatbot",
    name: "Dify 客服助手",
    description: "在 Dify 平台构建完成的多轮对话机器人，预置了全面的业务解答提示词与常用词库，支持多模态理解。",
    source: "dify",
    appType: "chat",
    url: "https://dify.ai", // 默认演示外链
    createdAt: "2026-06-08T10:00:00Z",
    updatedAt: "2026-06-08T11:00:00Z"
  },
  {
    id: "app-ragflow-docqa",
    name: "RAGFlow 专家检索系统",
    description: "依托 RAGFlow 的复杂版面解析技术，对公司输配电规程等长文档进行高精度向量切片和检索问答。",
    source: "ragflow",
    appType: "agent",
    url: "https://ragflow.io",
    createdAt: "2026-06-08T10:10:00Z",
    updatedAt: "2026-06-08T11:15:00Z"
  },
  {
    id: "app-n8n-sync",
    name: "n8n 数据处理工作流",
    description: "通过 n8n 编排的自动化流程，定时同步工单管理系统与客户服务数据，生成每日运行质量简报。",
    source: "n8n",
    appType: "workflow",
    url: "https://n8n.io",
    createdAt: "2026-06-08T10:20:00Z",
    updatedAt: "2026-06-08T11:20:00Z"
  },
  {
    id: "app-native-audit",
    name: "原生安全合规审计引擎",
    description: "本地原生开发的高精度安全审计模型应用，支持上传文档并一键输出格式化的现场违章及缺陷合规审计报告。",
    source: "native",
    appType: "completion",
    url: "/workbench", // 原生演示地址
    createdAt: "2026-06-08T10:30:00Z",
    updatedAt: "2026-06-08T11:30:00Z"
  }
];

export function getLocalApps(): PublishedApp[] {
  if (typeof window === "undefined") return INITIAL_APPS;
  const stored = localStorage.getItem("ai_platform_published_apps");
  if (!stored) {
    localStorage.setItem("ai_platform_published_apps", JSON.stringify(INITIAL_APPS));
    return INITIAL_APPS;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      throw new Error("Parsed data is not an array");
    }
    return parsed;
  } catch (e) {
    console.error("解析发布应用列表失败，重置为默认值", e);
    localStorage.setItem("ai_platform_published_apps", JSON.stringify(INITIAL_APPS));
    return INITIAL_APPS;
  }
}

export function saveLocalApps(list: PublishedApp[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("ai_platform_published_apps", JSON.stringify(list));
}
