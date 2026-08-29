import { Workflow, WorkflowCategory, WorkflowNode } from "./types";

function node(
  id: string,
  type: WorkflowNode["type"],
  x: number,
  label: string,
  description: string,
  config: WorkflowNode["data"]["config"] = {},
): WorkflowNode {
  return {
    id,
    type,
    position: { x, y: 150 },
    data: {
      label,
      description,
      config,
    },
  };
}

function workflow(
  id: string,
  name: string,
  description: string,
  category: WorkflowCategory,
  nodeSpecs: Array<[string, WorkflowNode["type"], string, string, WorkflowNode["data"]["config"]?]>,
  createdAt: string,
): Workflow {
  const nodes = nodeSpecs.map(([nodeId, type, label, desc, config], index) =>
    node(nodeId, type, 60 + index * 230, label, desc, config),
  );

  return {
    id,
    name,
    description,
    category,
    createdAt,
    updatedAt: createdAt,
    nodes,
    edges: nodes.slice(0, -1).map((item, index) => ({
      id: `edge-${id}-${index + 1}`,
      source: item.id,
      target: nodes[index + 1].id,
    })),
  };
}

export const INITIAL_WORKFLOWS: Workflow[] = [
  workflow(
    "workflow-contract-risk-review",
    "合同条款风险初审流程",
    "从合同文本上传、条款抽取、风险识别到法务复核，形成可追踪的合同初审链路。",
    "业务审批",
    [
      ["start", "start", "上传合同", "接收合同文本或扫描件", { prompt: "上传待审合同" }],
      ["ocr", "tool", "文档解析", "提取正文与关键页码", { toolId: "document-parser" }],
      ["risk", "skill", "风险识别", "识别违约、付款和交付风险", { skillId: "contract-risk" }],
      ["approve", "condition", "风险分流", "按风险等级分配复核路径", { conditionExpr: "riskLevel >= 3" }],
      ["end", "end", "输出意见", "生成初审意见和补充材料清单"],
    ],
    "2026-06-08T09:00:00Z",
  ),
  workflow(
    "workflow-expense-approval",
    "费用报销合规审批流程",
    "自动校验发票、预算科目和附件完整性，辅助财务完成报销审批前置检查。",
    "业务审批",
    [
      ["start", "start", "提交报销", "接收报销单与附件"],
      ["invoice", "service", "发票核验", "调用发票验真接口", { serviceId: "invoice-check" }],
      ["budget", "condition", "预算判断", "判断是否超预算", { conditionExpr: "amount <= budgetLeft" }],
      ["model", "model", "合规摘要", "生成审批摘要", { modelName: "DeepSeek-V4" }],
      ["end", "end", "审批材料", "输出审批建议"],
    ],
    "2026-06-08T09:20:00Z",
  ),
  workflow(
    "workflow-field-defect-triage",
    "现场缺陷巡检分派流程",
    "聚合巡检照片、缺陷描述和设备台账，自动分派处置等级与责任班组。",
    "巡检运维",
    [
      ["start", "start", "巡检上报", "接收照片与文字描述"],
      ["vision", "service", "缺陷识别", "调用图像识别服务", { serviceId: "tower-match" }],
      ["knowledge", "knowhub", "规程匹配", "检索缺陷处置标准", { knowledgeBaseId: "safety-rules" }],
      ["dispatch", "condition", "等级分派", "按缺陷等级分配责任人", { conditionExpr: "severity >= 2" }],
      ["end", "end", "派单完成", "输出派单信息"],
    ],
    "2026-06-08T09:40:00Z",
  ),
  workflow(
    "workflow-equipment-maintenance",
    "设备保养计划生成流程",
    "结合设备运行时长、检修记录和库存状态，生成月度保养计划与备件需求。",
    "巡检运维",
    [
      ["start", "start", "读取台账", "导入设备运行记录"],
      ["calc", "code", "周期计算", "计算保养窗口", { codeContent: "return nextMaintenanceDate;" }],
      ["stock", "service", "备件查询", "查询库存余量", { serviceId: "stock-query" }],
      ["model", "model", "计划生成", "整理保养计划", { modelName: "DeepSeek-V4" }],
      ["end", "end", "输出计划", "生成保养计划表"],
    ],
    "2026-06-08T10:00:00Z",
  ),
  workflow(
    "workflow-policy-knowledge-answer",
    "制度知识问答沉淀流程",
    "将员工提问、制度检索和答案复核串联起来，沉淀可复用的制度问答素材。",
    "文档知识",
    [
      ["start", "start", "员工提问", "接收制度相关问题"],
      ["retrieve", "knowhub", "制度检索", "检索制度知识库", { knowledgeBaseId: "hr-policy" }],
      ["model", "model", "答案生成", "基于引用生成回答", { modelName: "DeepSeek-V4" }],
      ["review", "condition", "人工复核", "判断是否需要人工确认", { conditionExpr: "confidence < 0.8" }],
      ["end", "end", "沉淀答案", "保存问答素材"],
    ],
    "2026-06-08T10:20:00Z",
  ),
  workflow(
    "workflow-bid-document-check",
    "投标文件响应检查流程",
    "对照招标文件自动检查响应点、附件、签章和格式要求，输出修订清单。",
    "文档知识",
    [
      ["start", "start", "导入文件", "接收招标与投标文件"],
      ["parse", "tool", "条款解析", "抽取响应要求", { toolId: "document-parser" }],
      ["compare", "skill", "响应比对", "检查缺漏项", { skillId: "bid-check" }],
      ["model", "model", "清单整理", "生成修订清单", { modelName: "DeepSeek-V4" }],
      ["end", "end", "输出报告", "导出检查报告"],
    ],
    "2026-06-08T10:40:00Z",
  ),
  workflow(
    "workflow-customer-ticket-routing",
    "客户工单智能分派流程",
    "对客户工单进行意图识别、优先级判断和责任团队分派，减少人工转派成本。",
    "客户服务",
    [
      ["start", "start", "接收工单", "导入客户问题"],
      ["model", "model", "意图识别", "识别问题类型", { modelName: "DeepSeek-V4" }],
      ["priority", "condition", "优先级判断", "判断是否紧急", { conditionExpr: "urgent === true" }],
      ["dispatch", "service", "分派团队", "写入工单系统", { serviceId: "ticket-dispatch" }],
      ["end", "end", "通知客户", "输出受理结果"],
    ],
    "2026-06-08T11:00:00Z",
  ),
  workflow(
    "workflow-after-sales-followup",
    "售后回访闭环流程",
    "根据交付记录生成回访任务，汇总客户反馈并自动创建后续处理事项。",
    "客户服务",
    [
      ["start", "start", "读取交付记录", "筛选待回访客户"],
      ["schedule", "tool", "生成任务", "生成回访待办", { toolId: "task-create" }],
      ["model", "model", "反馈摘要", "总结客户反馈", { modelName: "DeepSeek-V4" }],
      ["condition", "condition", "问题判断", "是否需要二次处理", { conditionExpr: "hasIssue === true" }],
      ["end", "end", "闭环归档", "归档回访记录"],
    ],
    "2026-06-08T11:20:00Z",
  ),
  workflow(
    "workflow-safety-training-quiz",
    "安全培训试题生成流程",
    "读取培训材料和规章条款，生成试题、答案解析和知识点标签。",
    "文档知识",
    [
      ["start", "start", "导入材料", "上传培训课件"],
      ["retrieve", "knowhub", "知识点检索", "检索安全规程", { knowledgeBaseId: "safety-rules" }],
      ["model", "model", "试题生成", "生成题目与解析", { modelName: "DeepSeek-V4" }],
      ["review", "skill", "质量检查", "检查题目清晰度", { skillId: "quiz-review" }],
      ["end", "end", "输出题库", "生成题库文件"],
    ],
    "2026-06-08T11:40:00Z",
  ),
  workflow(
    "workflow-project-risk-register",
    "项目风险登记跟踪流程",
    "从项目周报中抽取风险项，生成责任人、处置措施和跟踪状态。",
    "业务审批",
    [
      ["start", "start", "导入周报", "接收项目周报"],
      ["extract", "skill", "风险抽取", "提取风险事项", { skillId: "risk-extract" }],
      ["owner", "condition", "责任分配", "判断风险归属", { conditionExpr: "riskType !== ''" }],
      ["model", "model", "措施生成", "生成处置建议", { modelName: "DeepSeek-V4" }],
      ["end", "end", "登记完成", "输出风险登记表"],
    ],
    "2026-06-08T12:00:00Z",
  ),
];
