import { PublishedApp } from "./types";

const APP_STORAGE_KEY = "ai_platform_published_apps";
const APP_STORAGE_VERSION_KEY = "ai_platform_published_apps_version";
const APP_STORAGE_VERSION = "2026-06-11-app-center-v3";

export const INITIAL_APPS: PublishedApp[] = [
  {
    id: "app-dify-customer-ticket",
    name: "客户工单摘要分派助手",
    description: "自动读取客服对话和工单内容，提炼客户诉求、紧急程度与处理建议，并分派到对应业务小组。",
    source: "dify",
    appType: "business",
    url: "https://dify.ai",
    createdAt: "2026-06-08T09:00:00Z",
    updatedAt: "2026-06-08T09:30:00Z"
  },
  {
    id: "app-dify-contract-review",
    name: "合同条款风险初审助手",
    description: "面向采购、法务和项目团队，对合同文本进行条款抽取、异常提示和风险等级初判。",
    source: "dify",
    appType: "business",
    url: "https://dify.ai",
    createdAt: "2026-06-08T09:10:00Z",
    updatedAt: "2026-06-08T09:40:00Z"
  },
  {
    id: "app-dify-sales-brief",
    name: "销售拜访纪要生成助手",
    description: "根据客户拜访录音转写或手工记录，生成商机摘要、客户关注点、待办事项和下次跟进计划。",
    source: "dify",
    appType: "business",
    url: "https://dify.ai",
    createdAt: "2026-06-08T09:20:00Z",
    updatedAt: "2026-06-08T09:50:00Z"
  },
  {
    id: "app-dify-policy-qa",
    name: "人事制度问答助手",
    description: "聚合员工手册、考勤制度和福利政策，为员工提供制度问答和办理流程指引。",
    source: "dify",
    appType: "general",
    url: "https://dify.ai",
    createdAt: "2026-06-08T09:30:00Z",
    updatedAt: "2026-06-08T10:00:00Z"
  },
  {
    id: "app-dify-equipment-report",
    name: "设备巡检报告整理助手",
    description: "将现场巡检记录、照片说明和缺陷描述整理为结构化报告，辅助运维主管快速复核。",
    source: "dify",
    appType: "business",
    url: "https://dify.ai",
    createdAt: "2026-06-08T09:40:00Z",
    updatedAt: "2026-06-08T10:10:00Z"
  },
  {
    id: "app-dify-bid-document",
    name: "投标文件响应检查助手",
    description: "对照招标要求检查投标文件响应项、缺漏材料和关键格式，输出可执行的修订清单。",
    source: "dify",
    appType: "business",
    url: "https://dify.ai",
    createdAt: "2026-06-08T09:50:00Z",
    updatedAt: "2026-06-08T10:20:00Z"
  },
  {
    id: "app-n8n-invoice-check",
    name: "发票到账核验提醒流程",
    description: "自动比对发票、付款单和供应商信息，对异常金额、缺失附件和逾期到账生成提醒。",
    source: "n8n",
    appType: "business",
    url: "https://n8n.io",
    createdAt: "2026-06-08T10:00:00Z",
    updatedAt: "2026-06-08T10:30:00Z"
  },
  {
    id: "app-n8n-warehouse-alert",
    name: "备品备件库存预警流程",
    description: "定时读取库存台账和领用记录，对低库存、高消耗和长期呆滞备件推送预警。",
    source: "n8n",
    appType: "business",
    url: "https://n8n.io",
    createdAt: "2026-06-08T10:10:00Z",
    updatedAt: "2026-06-08T10:40:00Z"
  },
  {
    id: "app-n8n-project-daily",
    name: "项目日报汇总推送流程",
    description: "汇总项目成员日报、里程碑状态和风险备注，按项目维度生成日报并推送给负责人。",
    source: "n8n",
    appType: "business",
    url: "https://n8n.io",
    createdAt: "2026-06-08T10:20:00Z",
    updatedAt: "2026-06-08T10:50:00Z"
  },
  {
    id: "app-n8n-after-sales",
    name: "售后回访任务派发流程",
    description: "根据交付记录和客户满意度表，自动创建回访任务、分配责任人并跟踪处理状态。",
    source: "n8n",
    appType: "business",
    url: "https://n8n.io",
    createdAt: "2026-06-08T10:30:00Z",
    updatedAt: "2026-06-08T11:00:00Z"
  },
  {
    id: "app-native-safety-audit",
    name: "现场违章合规审计",
    description: "上传现场记录和检查照片，识别违章描述、制度依据和整改建议，生成审计结果。",
    source: "native",
    appType: "business",
    url: "/workbench",
    createdAt: "2026-06-08T10:40:00Z",
    updatedAt: "2026-06-08T11:10:00Z"
  },
  {
    id: "app-native-tower-defect",
    name: "输电缺陷照片初筛",
    description: "面向输电线路巡检照片，对塔材锈蚀、绝缘子破损和异物挂线进行初步筛查。",
    source: "native",
    appType: "business",
    url: "/workbench",
    createdAt: "2026-06-08T10:50:00Z",
    updatedAt: "2026-06-08T11:20:00Z"
  },
  {
    id: "app-native-knowledge-search",
    name: "规程制度检索问答",
    description: "检索企业规程、制度和技术标准，返回依据片段、适用范围和操作建议。",
    source: "native",
    appType: "general",
    url: "/workbench",
    createdAt: "2026-06-08T11:00:00Z",
    updatedAt: "2026-06-08T11:30:00Z"
  },
  {
    id: "app-native-meeting-action",
    name: "会议纪要待办提取",
    description: "从会议纪要或转写文本中提取决议事项、责任人、截止时间和风险提醒。",
    source: "native",
    appType: "general",
    url: "/workbench",
    createdAt: "2026-06-08T11:10:00Z",
    updatedAt: "2026-06-08T11:40:00Z"
  },
  {
    id: "app-native-asset-ledger",
    name: "固定资产台账核对",
    description: "对资产清单、盘点记录和责任部门进行比对，标记账实不符、缺失字段和疑似重复项。",
    source: "native",
    appType: "business",
    url: "/workbench",
    createdAt: "2026-06-08T11:20:00Z",
    updatedAt: "2026-06-08T11:50:00Z"
  },
  {
    id: "app-native-risk-register",
    name: "项目风险登记助手",
    description: "根据项目周报和问题清单，整理风险项、影响范围、处置措施和责任跟踪状态。",
    source: "native",
    appType: "business",
    url: "/workbench",
    createdAt: "2026-06-08T11:30:00Z",
    updatedAt: "2026-06-08T12:00:00Z"
  },
  {
    id: "app-native-training-quiz",
    name: "安全培训试题生成",
    description: "根据培训材料生成单选、多选和判断题，并输出答案解析和知识点标签。",
    source: "native",
    appType: "general",
    url: "/workbench",
    createdAt: "2026-06-08T11:40:00Z",
    updatedAt: "2026-06-08T12:10:00Z"
  },
  {
    id: "app-native-service-acceptance",
    name: "服务验收材料检查",
    description: "检查验收报告、交付清单和附件材料是否完整，输出缺项说明和补正建议。",
    source: "native",
    appType: "business",
    url: "/workbench",
    createdAt: "2026-06-08T11:50:00Z",
    updatedAt: "2026-06-08T12:20:00Z"
  }
];

export function getLocalApps(): PublishedApp[] {
  if (typeof window === "undefined") return INITIAL_APPS;
  const storedVersion = localStorage.getItem(APP_STORAGE_VERSION_KEY);
  if (storedVersion !== APP_STORAGE_VERSION) {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(INITIAL_APPS));
    localStorage.setItem(APP_STORAGE_VERSION_KEY, APP_STORAGE_VERSION);
    return INITIAL_APPS;
  }

  const stored = localStorage.getItem(APP_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(INITIAL_APPS));
    localStorage.setItem(APP_STORAGE_VERSION_KEY, APP_STORAGE_VERSION);
    return INITIAL_APPS;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.some((item) => item?.appType !== "business" && item?.appType !== "general")) {
      throw new Error("Parsed data is not an array");
    }
    return parsed;
  } catch (e) {
    console.error("解析发布应用列表失败，重置为默认值", e);
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(INITIAL_APPS));
    localStorage.setItem(APP_STORAGE_VERSION_KEY, APP_STORAGE_VERSION);
    return INITIAL_APPS;
  }
}

export function saveLocalApps(list: PublishedApp[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(list));
  localStorage.setItem(APP_STORAGE_VERSION_KEY, APP_STORAGE_VERSION);
}
