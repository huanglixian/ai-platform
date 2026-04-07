import type { PipelineRecord } from "@/knowhub/features/knowledge/types";
import type { DocSpaceRecord } from "@/knowhub/features/docspaces/types";
import type {
  FolderStrategyDraft,
  KnowledgeFileTypeDraft,
} from "@/knowhub/features/knowledge/builder-types";

const templateFactory = (): KnowledgeFileTypeDraft[] => [
  {
    key: "word",
    label: "Word 文档",
    hint: "适合制度、方案、报告正文和带层级目录的文档。",
    stages: [
      {
        key: "preprocess",
        label: "预处理阶段",
        description: "先统一格式并做文本结构整理。",
        items: [
          {
            id: "word-doc-to-docx",
            name: "DOC 转 DOCX",
            summary: "统一旧版 Word 格式，避免后续解析差异。",
            enabled: true,
          },
          {
            id: "word-header-footer-clean",
            name: "页眉页脚清理",
            summary: "清理页眉页脚、页码和重复干扰信息。",
            enabled: true,
          },
        ],
      },
      {
        key: "chunking",
        label: "切片阶段",
        description: "按文档结构切分正文内容。",
        items: [
          {
            id: "chunk-heading",
            name: "标题层级切片",
            summary: "按标题和子标题切分，保留章节路径。",
            enabled: true,
          },
        ],
      },
      {
        key: "extract",
        label: "提取阶段",
        description: "按需提炼要点与实体关系。",
        items: [
          {
            id: "extract-summary-points",
            name: "要点摘要提取",
            summary: "抽取段落和章节中的关键结论。",
            enabled: false,
          },
        ],
      },
    ],
  },
  {
    key: "excel",
    label: "Excel 表格",
    hint: "适合清册、台账、统计报表和多 Sheet 文件。",
    stages: [
      {
        key: "preprocess",
        label: "预处理阶段",
        description: "先整理表头表体，再统一 Sheet 结构。",
        items: [
          {
            id: "excel-sheet-split",
            name: "Sheet 拆分处理",
            summary: "拆分多 Sheet 工作簿，按表单独处理。",
            enabled: true,
          },
          {
            id: "excel-header-clean",
            name: "标题与表头清洗",
            summary: "识别复杂表头，统一多行表头结构。",
            enabled: true,
          },
        ],
      },
      {
        key: "chunking",
        label: "切片阶段",
        description: "按表格记录或主题切分。",
        items: [
          {
            id: "chunk-table-row",
            name: "表格行记录切片",
            summary: "按单行记录切片并保留表头。",
            enabled: true,
          },
        ],
      },
      {
        key: "extract",
        label: "提取阶段",
        description: "提取结构化字段和值关系。",
        items: [
          {
            id: "extract-table-fields",
            name: "表格字段提取",
            summary: "抽取字段和值，生成可入库结构。",
            enabled: true,
          },
        ],
      },
    ],
  },
  {
    key: "pdfText",
    label: "文字版 PDF",
    hint: "适合有可复制文本层的报告、规范和函件。",
    stages: [
      {
        key: "preprocess",
        label: "预处理阶段",
        description: "先转成结构化正文，再做清洗。",
        items: [
          {
            id: "pdf-to-markdown",
            name: "PDF 转 Markdown",
            summary: "将文字版 PDF 转成结构化正文。",
            enabled: true,
          },
        ],
      },
      {
        key: "chunking",
        label: "切片阶段",
        description: "按标题或页码窗口切分内容。",
        items: [
          {
            id: "chunk-heading-window",
            name: "标题窗口切片",
            summary: "按标题范围切片，保留章节上下文。",
            enabled: true,
          },
          {
            id: "chunk-page-window",
            name: "页码窗口切片",
            summary: "按页切分，适合扫描类报告内容。",
            enabled: false,
          },
        ],
      },
      {
        key: "extract",
        label: "提取阶段",
        description: "按需抽取摘要或实体信息。",
        items: [
          {
            id: "extract-summary-points",
            name: "要点摘要提取",
            summary: "提取章节中的结论和关键要点。",
            enabled: true,
          },
        ],
      },
    ],
  },
  {
    key: "pdfImage",
    label: "图片版 PDF",
    hint: "适合扫描件、盖章件和无法直接抽取文本的 PDF。",
    stages: [
      {
        key: "preprocess",
        label: "预处理阶段",
        description: "先做 OCR 和版面清理。",
        items: [
          {
            id: "pdf-ocr",
            name: "OCR 文本识别",
            summary: "识别扫描版 PDF 的正文和标题信息。",
            enabled: true,
          },
          {
            id: "pdf-denoise",
            name: "图像去噪与旋转校正",
            summary: "处理倾斜、噪点和背景阴影。",
            enabled: true,
          },
        ],
      },
      {
        key: "chunking",
        label: "切片阶段",
        description: "在 OCR 结果上按页和段落切分。",
        items: [
          {
            id: "chunk-fixed-overlap",
            name: "固定长度重叠切片",
            summary: "按固定窗口切片，适合 OCR 文本。",
            enabled: true,
          },
        ],
      },
      {
        key: "extract",
        label: "提取阶段",
        description: "对识别结果做要点补充提取。",
        items: [
          {
            id: "extract-entity-pairs",
            name: "实体关系提取",
            summary: "抽取工程实体和关键指标关系。",
            enabled: false,
          },
        ],
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

export function buildKnowledgeTaskRecord(input: {
  name: string;
  summary: string;
  knowledgeTarget: string;
  docspaces: DocSpaceRecord[];
  fileTypes: KnowledgeFileTypeDraft[];
}): PipelineRecord {
  const enabledDocspaces = input.docspaces;
  const targetLabel =
    enabledDocspaces.length > 1
      ? `${enabledDocspaces.length} 个 DocSpace / 混合文档`
      : `${enabledDocspaces[0]?.name ?? "未选择空间"} / 混合文档`;

  return {
    id: `draft_${Date.now().toString(36)}`,
    name: input.name,
    summary: input.summary,
    status: "draft",
    docspaceIds: enabledDocspaces.map((item) => item.id),
    targetLabel,
    preprocessStrategyIds: collectEnabledStrategyIds(input.fileTypes, "preprocess"),
    chunkingStrategyIds: collectEnabledStrategyIds(input.fileTypes, "chunking"),
    extractStrategyIds: collectEnabledStrategyIds(input.fileTypes, "extract"),
    embeddingModel: "bge-m3",
    knowledgeTarget: input.knowledgeTarget,
    lastRunAt: "未启动",
    runCount: 0,
  };
}
