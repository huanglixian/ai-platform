import type { AppType, PlatformSource } from "./types";

type MockApplication = {
  id: string;
  name: string;
  description: string;
  source: Exclude<PlatformSource, "appfactory" | "external">;
  appType: AppType;
  url: string;
  createdAt: string;
  updatedAt: string;
};

export const INITIAL_APPS: MockApplication[] = [
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
];
