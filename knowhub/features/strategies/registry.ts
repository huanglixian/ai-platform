import type {
  StrategyRecord,
  StrategyTemplateDefinition,
} from "@/knowhub/features/strategies/types";

const markdownObsidianSlicerTemplate: StrategyTemplateDefinition = {
  id: "markdown-obsidian-slicer",
  name: "Markdown 标题段落切片",
  category: "chunking",
  group: "Markdown",
  summary:
    "按 Markdown 标题层级和段落切片，保留父级标题链与行号范围，适合 Obsidian 笔记和结构化 Markdown 文本。",
  metaLabel: "方式",
  metaValue: "标题 + 段落",
  owner: "知识工程组",
  defaultPresetName: "默认预设",
  settings: [
    {
      key: "headingLevels",
      label: "标题层级",
      type: "number-array",
      description: "参与切片的标题层级，默认识别 1 到 3 级标题。",
      defaultValue: [1, 2, 3],
    },
    {
      key: "maxTokens",
      label: "最大 Token",
      type: "number",
      description: "单个正文切片的粗略 token 上限，0 表示不限制。",
      defaultValue: 0,
    },
    {
      key: "includeFrontmatter",
      label: "保留 Frontmatter",
      type: "boolean",
      description: "是否将文件头部的 YAML Frontmatter 一并参与切片。",
      defaultValue: false,
    },
  ],
};

export const strategyTemplates: StrategyTemplateDefinition[] = [
  markdownObsidianSlicerTemplate,
];

export function listStrategyTemplates() {
  return strategyTemplates;
}

export function getStrategyTemplateById(id: string) {
  return strategyTemplates.find((item) => item.id === id) ?? null;
}

export function createTemplateRecord(template: StrategyTemplateDefinition): StrategyRecord {
  return {
    id: template.id,
    name: template.name,
    category: template.category,
    group: template.group,
    summary: template.summary,
    metaLabel: template.metaLabel,
    metaValue: template.metaValue,
    owner: template.owner,
    usageCount: 0,
  };
}
