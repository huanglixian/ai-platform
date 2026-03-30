import { docSpaceRecords } from "@/knowhub/data/docspaces";
import { strategyRecords } from "@/knowhub/data/strategies";
import type { KnowHubFlowStage, KnowHubOverviewStat } from "@/knowhub/types";

const totalDocuments = docSpaceRecords.reduce(
  (sum, item) => sum + item.documentCount,
  0
);

export const knowHubOverviewIntro = {
  title: "KnowHub 知识中心",
  description:
    "围绕企业知识接入、处理、组织和复用构建统一入口，以 DocSpace 作为文档载体，以策略库作为处理标准，以知识内容沉淀可检索的业务资产。",
};

export const knowHubOverviewStats: KnowHubOverviewStat[] = [
  {
    key: "docspaces",
    label: "DocSpace",
    value: String(docSpaceRecords.length),
    hint: "知识空间总数",
  },
  {
    key: "documents",
    label: "文档总量",
    value: String(totalDocuments),
    hint: "已接入文档",
  },
  {
    key: "strategies",
    label: "策略数量",
    value: String(strategyRecords.length),
    hint: "预处理 + 切片",
  },
  {
    key: "knowledge",
    label: "知识库数量",
    value: "10",
    hint: "已沉淀知识内容",
  },
  {
    key: "retrieval",
    label: "检索次数",
    value: "18,420",
    hint: "近 30 日累计",
  },
];

export const knowHubFlowStages: KnowHubFlowStage[] = [
  {
    key: "source",
    title: "接入文档源",
    summary: "通过手工、FTP 或 OSS 接入现有资料，形成可追踪的来源快照。",
    metric: "FTP / OSS / 手工",
  },
  {
    key: "docspace",
    title: "文档管理",
    summary: "按 DocSpace 组织文档归属、范围和维护方，统一管理文档空间。",
    metric: `${docSpaceRecords.length} 个空间`,
  },
  {
    key: "preprocess",
    title: "配置预处理策略",
    summary: "对正文、附件和表格做清洗、归并和结构整理。",
    metric: "3 条已配置",
  },
  {
    key: "chunking",
    title: "配置切片策略",
    summary: "根据场景选择标题切片、父子切片或问答切片方式。",
    metric: "3 条已配置",
  },
  {
    key: "knowledge",
    title: "生成知识内容",
    summary: "把整理后的内容沉淀为可复用知识资产，面向业务场景组织。",
    metric: "10 个知识库",
  },
  {
    key: "retrieval",
    title: "检索使用",
    summary: "对接智能体、工具和业务流程，支撑问题检索与引用复用。",
    metric: "18,420 次检索",
  },
];
