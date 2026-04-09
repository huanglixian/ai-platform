import "server-only";

import { getDocSpaceById, readDocSpaceFile } from "@/knowhub/features/docspace/service";
import { embedTexts as requestEmbeddings } from "@/knowhub/features/knowledge/embedding-client";
import {
  getStoredKnowledgeById,
  saveStoredKnowledgeRun,
  updateStoredKnowledge,
  updateStoredKnowledgeRun,
} from "@/knowhub/features/knowledge/repository";
import type {
  KnowledgeRunRecord,
  PipelineRecord,
} from "@/knowhub/features/knowledge/types";
import { testStrategyTemplate } from "@/knowhub/features/strategies/service";
import { getVectorStore } from "@/knowhub/features/vector-store";
import type { VectorRecordInput } from "@/knowhub/features/vector-store/types";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(value))
    .replace(/\//g, "-");
}

function createRunRecord(knowledgeId: string): KnowledgeRunRecord {
  return {
    id: `run_${Date.now().toString(36)}`,
    knowledgeId,
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    fileCount: 0,
    chunkCount: 0,
    vectorCount: 0,
    message: "建库进行中",
  };
}

function getMarkdownPresetId(item: PipelineRecord) {
  const matched = item.strategyPresetBindings.find(
    (binding) => binding.strategyId === "markdown-obsidian-slicer",
  );

  return matched?.presetId ?? "markdown-obsidian-slicer__default";
}

export async function runKnowledgeBuild(knowledgeId: string) {
  const knowledge = await getStoredKnowledgeById(knowledgeId);

  if (!knowledge) {
    return null;
  }

  const runningKnowledge = await updateStoredKnowledge(knowledgeId, (item) => ({
    ...item,
    status: "running",
    lastError: null,
    updatedAt: new Date().toISOString(),
  }));

  if (!runningKnowledge) {
    return null;
  }

  const run = await saveStoredKnowledgeRun(createRunRecord(knowledgeId));

  try {
    if (!runningKnowledge.chunkingStrategyIds.includes("markdown-obsidian-slicer")) {
      throw new Error("当前知识库未启用 Markdown 切片策略");
    }

    const docspaces = await Promise.all(
      runningKnowledge.docspaceIds.map(async (docspaceId) => {
        const docspace = await getDocSpaceById(docspaceId);

        if (!docspace) {
          throw new Error(`未找到文档空间：${docspaceId}`);
        }

        return docspace;
      }),
    );
    const markdownFiles = docspaces.flatMap((docspace) =>
      docspace.files
        .filter((file) => file.path.toLowerCase().endsWith(".md"))
        .map((file) => ({
          docspaceId: docspace.id,
          file,
        })),
    );

    if (!markdownFiles.length) {
      throw new Error("未找到可建库的 Markdown 文件");
    }

    const presetId = getMarkdownPresetId(runningKnowledge);
    const vectorRecords: VectorRecordInput[] = [];
    let embeddingModelName = runningKnowledge.embeddingModel;
    let processedFileCount = 0;

    for (const entry of markdownFiles) {
      const fileContent = await readDocSpaceFile(entry.docspaceId, entry.file.path);

      if (!fileContent?.content.trim()) {
        continue;
      }

      const result = await testStrategyTemplate({
        templateId: "markdown-obsidian-slicer",
        presetId,
        filePath: fileContent.path,
        content: fileContent.content,
      });

      if (!result.sliceCount) {
        continue;
      }

      const embeddingResult = await requestEmbeddings(
        result.slices.map((slice) => slice.content),
      );

      if (embeddingResult.model) {
        embeddingModelName = embeddingResult.model;
      }

      result.slices.forEach((slice, index) => {
        vectorRecords.push({
          knowledgeId: runningKnowledge.id,
          sourceKey: `${entry.docspaceId}:${fileContent.path}`,
          docspaceId: entry.docspaceId,
          filePath: fileContent.path,
          fileName: fileContent.name,
          strategyId: "markdown-obsidian-slicer",
          sliceId: slice.id,
          tokenCount: slice.tokenCount,
          startLine: slice.range.startLine,
          endLine: slice.range.endLine,
          content: slice.content,
          kind: slice.kind,
          headingTitle: slice.heading?.title ?? null,
          parentHeadingsJson: JSON.stringify(slice.parentHeadings),
          embedding: embeddingResult.embeddings[index],
        });
      });

      processedFileCount += 1;
    }

    if (!vectorRecords.length) {
      throw new Error("Markdown 文件未生成有效切片");
    }

    const vectorDimension = vectorRecords[0]?.embedding.length ?? 0;

    if (!vectorDimension) {
      throw new Error("切片向量为空，无法写入向量库");
    }

    const vectorStore = await getVectorStore(vectorDimension);
    const stats = vectorStore.replaceKnowledgeVectors(runningKnowledge.id, vectorRecords);
    const finishedAt = new Date().toISOString();
    const nextRun = await updateStoredKnowledgeRun(run.id, (currentRun) => ({
      ...currentRun,
      status: "succeeded",
      finishedAt,
      fileCount: processedFileCount,
      chunkCount: vectorRecords.length,
      vectorCount: stats.vectorCount,
      message: "建库完成",
    }));
    const nextKnowledge = await updateStoredKnowledge(runningKnowledge.id, (item) => ({
      ...item,
      status: "published",
      fileCount: processedFileCount,
      chunkCount: vectorRecords.length,
      vectorCount: stats.vectorCount,
      vectorStoreName: "sqlite-vec",
      embeddingModel: embeddingModelName,
      lastRunAt: formatDateTime(finishedAt),
      runCount: item.runCount + 1,
      lastError: null,
      updatedAt: finishedAt,
    }));

    if (!nextRun || !nextKnowledge) {
      throw new Error("建库结果保存失败");
    }

    return {
      item: nextKnowledge,
      run: nextRun,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "建库失败";
    const finishedAt = new Date().toISOString();
    const failedRun = await updateStoredKnowledgeRun(run.id, (currentRun) => ({
      ...currentRun,
      status: "failed",
      finishedAt,
      message,
    }));
    const failedKnowledge = await updateStoredKnowledge(runningKnowledge.id, (item) => ({
      ...item,
      status: "failed",
      lastRunAt: formatDateTime(finishedAt),
      runCount: item.runCount + 1,
      lastError: message,
      updatedAt: finishedAt,
    }));

    if (!failedRun || !failedKnowledge) {
      throw new Error(message);
    }

    return {
      item: failedKnowledge,
      run: failedRun,
    };
  }
}
