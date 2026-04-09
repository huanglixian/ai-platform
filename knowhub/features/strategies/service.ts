import "server-only";

import {
  getStoredStrategyPreset,
  listStoredStrategyPresets,
  saveStoredStrategyPreset,
  updateStoredStrategyPreset,
} from "@/knowhub/features/strategies/preset-repository";
import {
  getStrategyTemplateById,
  listStrategyTemplates,
} from "@/knowhub/features/strategies/registry";
import { runMarkdownObsidianSlicer } from "@/knowhub/features/strategies/executors/markdown-obsidian-slicer";
import type {
  StrategyPresetRecord,
  StrategySettingValue,
} from "@/knowhub/features/strategies/types";

function createDefaultPresetValues(templateId: string) {
  const template = getStrategyTemplateById(templateId);

  if (!template) {
    throw new Error(`未找到策略模板：${templateId}`);
  }

  return Object.fromEntries(
    template.settings.map((item) => [item.key, item.defaultValue]),
  ) as Record<string, StrategySettingValue>;
}

function createDefaultPreset(templateId: string): StrategyPresetRecord {
  const template = getStrategyTemplateById(templateId);

  if (!template) {
    throw new Error(`未找到策略模板：${templateId}`);
  }

  return {
    id: `${template.id}__default`,
    templateId: template.id,
    name: template.defaultPresetName,
    readonly: true,
    values: createDefaultPresetValues(template.id),
    createdAt: "",
    updatedAt: "",
  };
}

function ensureTemplate(templateId: string) {
  const template = getStrategyTemplateById(templateId);

  if (!template) {
    throw new Error(`未找到策略模板：${templateId}`);
  }

  return template;
}

function mergePresetValues(
  templateId: string,
  values?: Record<string, StrategySettingValue>,
) {
  return {
    ...createDefaultPresetValues(templateId),
    ...(values ?? {}),
  };
}

async function resolvePreset(presetId: string) {
  if (presetId.endsWith("__default")) {
    const templateId = presetId.slice(0, -"__default".length);
    return createDefaultPreset(templateId);
  }

  return getStoredStrategyPreset(presetId);
}

export function listRegisteredStrategyTemplates() {
  return listStrategyTemplates();
}

export async function listStrategyPresetItems(templateId?: string) {
  const templates = templateId
    ? [ensureTemplate(templateId)]
    : listStrategyTemplates();
  const storedItems = await listStoredStrategyPresets();
  const storedByTemplate = templateId
    ? storedItems.filter((item) => item.templateId === templateId)
    : storedItems;

  return [
    ...templates.map((item) => createDefaultPreset(item.id)),
    ...storedByTemplate,
  ];
}

export async function createStrategyPreset(input: {
  templateId: string;
  name: string;
  values?: Record<string, StrategySettingValue>;
}) {
  const template = ensureTemplate(input.templateId);
  const name = input.name.trim();

  if (!name) {
    throw new Error("请输入预设名称");
  }

  const now = new Date().toISOString();
  const preset: StrategyPresetRecord = {
    id: `preset_${Date.now().toString(36)}`,
    templateId: template.id,
    name,
    readonly: false,
    values: mergePresetValues(template.id, input.values),
    createdAt: now,
    updatedAt: now,
  };

  return saveStoredStrategyPreset(preset);
}

export async function updateStrategyPreset(input: {
  id: string;
  name: string;
  values?: Record<string, StrategySettingValue>;
}) {
  const currentPreset = await resolvePreset(input.id);

  if (!currentPreset) {
    return null;
  }

  if (currentPreset.readonly) {
    throw new Error("默认预设不允许直接修改，请另存为新预设");
  }

  const name = input.name.trim();

  if (!name) {
    throw new Error("请输入预设名称");
  }

  return updateStoredStrategyPreset(input.id, (preset) => ({
    ...preset,
    name,
    values: mergePresetValues(preset.templateId, input.values),
    updatedAt: new Date().toISOString(),
  }));
}

export async function testStrategyTemplate(input: {
  templateId: string;
  filePath: string;
  content: string;
  values?: Record<string, StrategySettingValue>;
  presetId?: string;
}) {
  const template = ensureTemplate(input.templateId);
  const preset = input.presetId ? await resolvePreset(input.presetId) : null;

  if (preset && preset.templateId !== template.id) {
    throw new Error("预设与策略模板不匹配");
  }

  const values = mergePresetValues(
    template.id,
    input.values ?? preset?.values,
  );

  if (template.id === "markdown-obsidian-slicer") {
    return runMarkdownObsidianSlicer({
      filePath: input.filePath,
      content: input.content,
      values,
    });
  }

  throw new Error(`未实现策略执行器：${template.id}`);
}
