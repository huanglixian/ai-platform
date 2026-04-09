import { getStrategyTemplateById } from "@/knowhub/features/strategies/registry";
import { strategyRecords } from "@/knowhub/features/strategies/data";
import type { DocSpaceRecord } from "@/knowhub/features/docspace/types";
import type {
  FolderStrategyDraft,
  KnowledgeFileTypeDraft,
} from "@/knowhub/features/knowledge/builder-types";
import type {
  CreateKnowledgeInput,
  StrategyPresetBinding,
} from "@/knowhub/features/knowledge/types";

function createStrategyDraftItem(id: string, enabled: boolean) {
  const strategy = strategyRecords.find((item) => item.id === id);

  if (!strategy) {
    throw new Error(`未找到策略：${id}`);
  }

  return {
    id: strategy.id,
    name: strategy.name,
    summary: strategy.summary,
    enabled,
  };
}

const templateFactory = (): KnowledgeFileTypeDraft[] => [
  {
    key: "markdown",
    label: "Markdown 文档",
    stages: [
      {
        key: "preprocess",
        label: "预处理阶段",
        description: "Markdown 原文直接入库，当前默认不额外预处理。",
        items: [],
      },
      {
        key: "chunking",
        label: "切片阶段",
        description: "按标题层级和段落结构切分 Markdown 内容。",
        items: [createStrategyDraftItem("markdown-obsidian-slicer", true)],
      },
      {
        key: "extract",
        label: "提取阶段",
        description: "当前默认不启用额外提取。",
        items: [],
      },
    ],
  },
  {
    key: "word",
    label: "Word 文档",
    stages: [
      {
        key: "preprocess",
        label: "预处理阶段",
        description: "先统一格式并做文本结构整理。",
        items: [
          createStrategyDraftItem("word-doc-to-docx", true),
          createStrategyDraftItem("word-header-footer-clean", true),
        ],
      },
      {
        key: "chunking",
        label: "切片阶段",
        description: "按文档结构切分正文内容。",
        items: [createStrategyDraftItem("chunk-heading", true)],
      },
      {
        key: "extract",
        label: "提取阶段",
        description: "按需提炼要点与实体关系。",
        items: [createStrategyDraftItem("extract-summary-points", false)],
      },
    ],
  },
  {
    key: "excel",
    label: "Excel 表格",
    stages: [
      {
        key: "preprocess",
        label: "预处理阶段",
        description: "先整理表头表体，再统一 Sheet 结构。",
        items: [
          createStrategyDraftItem("excel-sheet-split", true),
          createStrategyDraftItem("excel-header-clean", true),
        ],
      },
      {
        key: "chunking",
        label: "切片阶段",
        description: "按表格记录或主题切分。",
        items: [createStrategyDraftItem("chunk-table-row", true)],
      },
      {
        key: "extract",
        label: "提取阶段",
        description: "提取结构化字段和值关系。",
        items: [createStrategyDraftItem("extract-table-fields", true)],
      },
    ],
  },
  {
    key: "pdfText",
    label: "文字版 PDF",
    stages: [
      {
        key: "preprocess",
        label: "预处理阶段",
        description: "先转成结构化正文，再做清洗。",
        items: [createStrategyDraftItem("pdf-to-markdown", true)],
      },
      {
        key: "chunking",
        label: "切片阶段",
        description: "按标题或页码窗口切分内容。",
        items: [
          createStrategyDraftItem("chunk-heading-window", true),
          createStrategyDraftItem("chunk-page-window", false),
        ],
      },
      {
        key: "extract",
        label: "提取阶段",
        description: "按需抽取摘要或实体信息。",
        items: [createStrategyDraftItem("extract-summary-points", true)],
      },
    ],
  },
  {
    key: "pdfImage",
    label: "图片版 PDF",
    stages: [
      {
        key: "preprocess",
        label: "预处理阶段",
        description: "先做 OCR 和版面清理。",
        items: [
          createStrategyDraftItem("pdf-to-markdown", true),
          createStrategyDraftItem("word-header-footer-clean", false),
        ],
      },
      {
        key: "chunking",
        label: "切片阶段",
        description: "在 OCR 结果上按页和段落切分。",
        items: [createStrategyDraftItem("chunk-fixed-overlap", true)],
      },
      {
        key: "extract",
        label: "提取阶段",
        description: "对识别结果做要点补充提取。",
        items: [createStrategyDraftItem("extract-entity-pairs", false)],
      },
    ],
  },
];

export function createGlobalStrategyTemplate() {
  return templateFactory();
}

export function createFolderStrategyDraft(
  docspace: DocSpaceRecord,
  path: string,
): FolderStrategyDraft {
  return {
    id: `folder_${docspace.id}_${path.replaceAll("/", "_")}_${Date.now().toString(36)}`,
    docspaceId: docspace.id,
    docspaceName: docspace.name,
    path,
    fileTypes: templateFactory(),
  };
}

function collectEnabledStrategyIds(
  fileTypes: KnowledgeFileTypeDraft[],
  stageKey: "preprocess" | "chunking" | "extract",
) {
  return fileTypes
    .flatMap((fileType) => fileType.stages)
    .filter((stage) => stage.key === stageKey)
    .flatMap((stage) => stage.items)
    .filter((item) => item.enabled)
    .map((item) => item.id);
}

function collectStrategyPresetBindings(fileTypes: KnowledgeFileTypeDraft[]) {
  const enabledStrategyIds = fileTypes
    .flatMap((fileType) => fileType.stages)
    .flatMap((stage) => stage.items)
    .filter((item) => item.enabled)
    .map((item) => item.id);
  const bindings: StrategyPresetBinding[] = [];

  enabledStrategyIds.forEach((strategyId) => {
    if (!getStrategyTemplateById(strategyId)) {
      return;
    }

    bindings.push({
      strategyId,
      presetId: `${strategyId}__default`,
    });
  });

  return bindings;
}

export function buildKnowledgeCreateInput(input: {
  name: string;
  summary: string;
  docspaceItems: DocSpaceRecord[];
  fileTypes: KnowledgeFileTypeDraft[];
}): CreateKnowledgeInput {
  const enabledItems = input.docspaceItems;
  const fileTypeLabels = input.fileTypes
    .filter((fileType) =>
      fileType.stages.some((stage) => stage.items.some((item) => item.enabled)),
    )
    .map((fileType) => fileType.label.replace(" 文档", ""))
    .join(" + ");
  const targetLabel =
    enabledItems.length > 1
      ? `${enabledItems.length} 个文档空间 / ${fileTypeLabels || "混合文档"}`
      : `${enabledItems[0]?.name ?? "未选择空间"} / ${fileTypeLabels || "混合文档"}`;

  return {
    name: input.name,
    summary: input.summary,
    docspaceIds: enabledItems.map((item) => item.id),
    targetLabel,
    preprocessStrategyIds: collectEnabledStrategyIds(input.fileTypes, "preprocess"),
    chunkingStrategyIds: collectEnabledStrategyIds(input.fileTypes, "chunking"),
    extractStrategyIds: collectEnabledStrategyIds(input.fileTypes, "extract"),
    strategyPresetBindings: collectStrategyPresetBindings(input.fileTypes),
    embeddingModel: "跟随全局 Embedding 配置",
    knowledgeTarget: input.name,
  };
}
