import type { WorkflowRecord } from "./types";

export const workflowRecords: WorkflowRecord[] = [
  {
    id: "route-compare",
    name: "路径方案比选流",
    code: "route-compare",
    emoji: "🛣️",
    description: "串联路径生成、合规校核、敏感点分析和方案排序，形成比选结论。",
    status: "运行中",
    metrics: [
      { label: "节点", value: "12" },
      { label: "技能", value: "4" },
      { label: "工具", value: "6" },
      { label: "发布", value: "v3" },
    ],
    tags: ["方案比选", "自动汇总", "常用"],
  },
  {
    id: "report-review",
    name: "报告校审流",
    code: "report-review",
    emoji: "📘",
    description: "组合通用校审、标准引用校验和图表一致性检查，输出校审问题清单。",
    status: "运行中",
    metrics: [
      { label: "节点", value: "9" },
      { label: "技能", value: "5" },
      { label: "工具", value: "7" },
      { label: "发布", value: "v5" },
    ],
    tags: ["报告校审", "批量处理", "质量控制"],
  },
  {
    id: "agreement-generate",
    name: "协议资料生成流",
    code: "agreement-generate",
    emoji: "📝",
    description: "根据线路路径、行政区划和部门映射，自动生成路径协议与资料包。",
    status: "待排期",
    metrics: [
      { label: "节点", value: "7" },
      { label: "技能", value: "3" },
      { label: "工具", value: "4" },
      { label: "触发", value: "人工" },
    ],
    tags: ["资料生成", "审批前置"],
  },
  {
    id: "tower-batch",
    name: "塔重估测批处理流",
    code: "tower-batch",
    emoji: "🏗️",
    description: "接收一批工况条件后批量调用塔重估测服务，统一产出预测结果和汇总表。",
    status: "草稿",
    metrics: [
      { label: "节点", value: "5" },
      { label: "技能", value: "2" },
      { label: "工具", value: "3" },
      { label: "触发", value: "定时" },
    ],
    tags: ["批处理", "塔重估测"],
  },
];
