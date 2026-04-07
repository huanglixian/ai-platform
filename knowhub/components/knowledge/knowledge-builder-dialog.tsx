"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Settings2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileScopePickerDialog } from "@/knowhub/components/knowledge/file-scope-picker-dialog";
import { FolderStrategyDialog } from "@/knowhub/components/knowledge/folder-strategy-dialog";
import { StrategyStageEditor } from "@/knowhub/components/knowledge/strategy-stage-editor";
import {
  buildKnowledgeTaskRecord,
  createFolderStrategyDraft,
  createGlobalStrategyTemplate,
} from "@/knowhub/features/knowledge/builder-data";
import type {
  FolderStrategyDraft,
  KnowledgeFileTypeKey,
} from "@/knowhub/features/knowledge/builder-types";
import type { PipelineRecord } from "@/knowhub/features/knowledge/types";
import type { DocSpaceRecord } from "@/knowhub/features/docspaces/types";

type KnowledgeBuilderDialogProps = {
  open: boolean;
  docspaces: DocSpaceRecord[];
  initialDocspaceId?: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (item: PipelineRecord) => void;
};

export function KnowledgeBuilderDialog({
  open,
  docspaces,
  initialDocspaceId,
  onOpenChange,
  onCreated,
}: KnowledgeBuilderDialogProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedDocspaceIds, setSelectedDocspaceIds] = useState<string[]>([]);
  const [knowledgeName, setKnowledgeName] = useState("");
  const [knowledgeTarget, setKnowledgeTarget] = useState("");
  const [summary, setSummary] = useState("");
  const [activeFileType, setActiveFileType] = useState<KnowledgeFileTypeKey>("word");
  const [fileTypes, setFileTypes] = useState(createGlobalStrategyTemplate());
  const [folderStrategies, setFolderStrategies] = useState<FolderStrategyDraft[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedDocspaceIds(initialDocspaceId ? [initialDocspaceId] : []);
  }, [initialDocspaceId, open]);

  const visibleDocspaces = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return docspaces.filter((item) => {
      if (!normalizedKeyword) {
        return true;
      }

      return (
        item.name.toLowerCase().includes(normalizedKeyword) ||
        item.summary.toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [docspaces, keyword]);

  const activeConfig =
    fileTypes.find((item) => item.key === activeFileType) ?? fileTypes[0];
  const editingFolder =
    folderStrategies.find((item) => item.id === editingFolderId) ?? null;

  function resetForm() {
    setKeyword("");
    setSelectedDocspaceIds(initialDocspaceId ? [initialDocspaceId] : []);
    setKnowledgeName("");
    setKnowledgeTarget("");
    setSummary("");
    setActiveFileType("word");
    setFileTypes(createGlobalStrategyTemplate());
    setFolderStrategies([]);
    setPickerOpen(false);
    setEditingFolderId(null);
    setError("");
  }

  function closeDialog() {
    onOpenChange(false);
    resetForm();
  }

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(15,23,42,0.28)] px-4 py-6 backdrop-blur-[2px]">
        <div className="flex max-h-[calc(100vh-48px)] w-full max-w-[1120px] flex-col overflow-hidden rounded-[20px] border border-[#d6e0eb] bg-[linear-gradient(180deg,rgba(248,250,253,0.98)_0%,rgba(255,255,255,0.98)_100%)] shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-3 border-b border-[#e7edf4] px-5 py-4">
            <div>
              <div className="text-title text-[20px] font-semibold tracking-[-0.03em]">
                新建知识建库任务
              </div>
              <div className="mt-1 text-[13px] leading-6 text-[#667085]">
                先引用默认全局策略，再结合当前任务范围做局部调整。
              </div>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-[10px] border border-[#dbe5f0] p-2 text-[#667085] transition-colors hover:border-[#c7d8ea] hover:text-title"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid flex-1 gap-4 overflow-y-auto px-5 py-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="flex flex-col gap-4">
              <section className="rounded-[16px] border border-[#d8e1eb] bg-[#f8fbfe] px-4 py-4">
                <div className="text-title text-[15px] font-semibold">任务信息</div>
                <div className="mt-3 grid gap-3">
                  <div>
                    <div className="mb-1 text-[12px] text-[#5f6f82]">任务名称</div>
                    <Input
                      value={knowledgeName}
                      onChange={(event) => setKnowledgeName(event.target.value)}
                      placeholder="例如：校审成果知识建库"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-[12px] text-[#5f6f82]">输出知识库</div>
                    <Input
                      value={knowledgeTarget}
                      onChange={(event) => setKnowledgeTarget(event.target.value)}
                      placeholder="例如：校审经验知识库"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-[12px] text-[#5f6f82]">任务说明</div>
                    <textarea
                      value={summary}
                      onChange={(event) => setSummary(event.target.value)}
                      placeholder="简要说明本次建库对象、范围和目的"
                      className="min-h-[96px] w-full rounded-[10px] border border-[#cfd8e3] bg-white px-3 py-2 text-[13px] outline-none transition-colors focus:border-[#2e7dd2]"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-title text-[15px] font-semibold">目标 DocSpace</div>
                  <span className="text-[11px] text-[#7b8798]">
                    已选 {selectedDocspaceIds.length} 个
                  </span>
                </div>
                <div className="mt-3 rounded-[12px] border border-[#e7edf4] bg-[#f8fbfe] px-3">
                  <Input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索 DocSpace"
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                <div className="mt-3 flex max-h-[320px] flex-col gap-2 overflow-y-auto">
                  {visibleDocspaces.map((item) => {
                    const checked = selectedDocspaceIds.includes(item.id);
                    const locked = initialDocspaceId === item.id;

                    return (
                      <label
                        key={item.id}
                        className="flex items-start gap-3 rounded-[14px] border px-3 py-3"
                        style={{
                          borderColor: checked ? "#c7d7ea" : "#e6edf4",
                          backgroundColor: checked ? "#f1f6fb" : "#ffffff",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={Boolean(initialDocspaceId && locked)}
                          onChange={() =>
                            setSelectedDocspaceIds((current) =>
                              checked
                                ? current.filter((id) => id !== item.id)
                                : [...current, item.id],
                            )
                          }
                          className="mt-0.5 h-4 w-4"
                        />
                        <div className="min-w-0">
                          <div className="text-title text-[13px] font-medium">
                            {item.name}
                          </div>
                          <div className="mt-1 text-[12px] leading-5 text-[#667085]">
                            {item.summary || "未填写空间说明"}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>
            </aside>

            <section className="flex flex-col gap-4">
              <section className="rounded-[16px] border border-[#d8e1eb] bg-[linear-gradient(180deg,rgba(237,242,248,0.96)_0%,rgba(246,249,253,0.98)_100%)] px-4 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-title text-[15px] font-semibold">全局默认策略</div>
                    <div className="mt-1 text-[12px] leading-5 text-[#667085]">
                      当前任务默认继承系统级全局策略。你可以在本任务中继续调整启用状态和顺序。
                    </div>
                  </div>
                  <Link
                    href="/knowhub/settings/global-strategies"
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1a4d87]"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    前往配置全局策略
                  </Link>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {fileTypes.map((item) => {
                    const active = item.key === activeFileType;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveFileType(item.key)}
                        className="rounded-full border px-3 py-1 text-[12px] font-medium transition-colors"
                        style={{
                          borderColor: active ? "#c7d7ea" : "#d9e3ed",
                          backgroundColor: active ? "#e9f0f8" : "rgba(255,255,255,0.72)",
                          color: active ? "#1a4d87" : "#667085",
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {activeConfig ? (
                  <div className="mt-4">
                    <div className="mb-3 rounded-[14px] border border-[#e7edf4] bg-white px-4 py-3 text-[12px] text-[#667085]">
                      {activeConfig.hint}
                    </div>
                    <StrategyStageEditor
                      value={activeConfig}
                      onChange={(nextValue) =>
                        setFileTypes((current) =>
                          current.map((item) =>
                            item.key === nextValue.key ? nextValue : item,
                          ),
                        )
                      }
                    />
                  </div>
                ) : null}
              </section>

              <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-title text-[15px] font-semibold">文件夹策略</div>
                    <div className="mt-1 text-[12px] leading-5 text-[#667085]">
                      为特殊目录单独覆盖默认策略。命中后优先于全局策略执行。
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setPickerOpen(true)}
                    disabled={!selectedDocspaceIds.length}
                  >
                    新增文件夹策略
                  </Button>
                </div>

                <div className="mt-4">
                  {folderStrategies.length ? (
                    <div className="flex flex-col gap-2">
                      {folderStrategies.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-[14px] border border-[#e7edf4] bg-[#f8fbfe] px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="text-title text-[13px] font-medium">
                              {item.docspaceName} / {item.path}
                            </div>
                            <div className="mt-1 text-[12px] text-[#667085]">
                              继承全局策略后，可对当前文件夹单独关闭、开启或调整顺序。
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingFolderId(item.id)}
                            >
                              独立配置
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                setFolderStrategies((current) =>
                                  current.filter((currentItem) => currentItem.id !== item.id),
                                )
                              }
                            >
                              删除
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[14px] border border-dashed border-[#d6e0eb] bg-[#fafcff] px-4 py-8 text-center text-[13px] text-[#667085]">
                      暂无文件夹级覆盖，当前任务将完整沿用默认全局策略。
                    </div>
                  )}
                </div>
              </section>

              {error ? (
                <div className="rounded-[14px] border border-[#f0d2d2] bg-[#fff8f8] px-4 py-3 text-[13px] text-[#a33a3a]">
                  {error}
                </div>
              ) : null}
            </section>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#e7edf4] px-5 py-4">
            <Button variant="outline" onClick={closeDialog}>
              取消
            </Button>
            <Button
              onClick={() => {
                const selectedDocspaces = docspaces.filter((item) =>
                  selectedDocspaceIds.includes(item.id),
                );

                if (!knowledgeName.trim()) {
                  setError("请输入任务名称");
                  return;
                }

                if (!knowledgeTarget.trim()) {
                  setError("请输入输出知识库名称");
                  return;
                }

                if (!selectedDocspaces.length) {
                  setError("至少选择一个 DocSpace");
                  return;
                }

                const nextItem = buildKnowledgeTaskRecord({
                  name: knowledgeName.trim(),
                  summary: summary.trim() || "基于默认策略创建的知识建库任务。",
                  knowledgeTarget: knowledgeTarget.trim(),
                  docspaces: selectedDocspaces,
                  fileTypes,
                });

                onCreated(nextItem);
                closeDialog();
              }}
            >
              确认建库
            </Button>
          </div>
        </div>
      </div>

      <FileScopePickerDialog
        open={pickerOpen}
        docspaces={docspaces.filter((item) => selectedDocspaceIds.includes(item.id))}
        onOpenChange={setPickerOpen}
        onConfirm={(docspaceId, path) => {
          const docspace = docspaces.find((item) => item.id === docspaceId);

          if (!docspace) {
            return;
          }

          setFolderStrategies((current) => [...current, createFolderStrategyDraft(docspace, path)]);
        }}
      />

      <FolderStrategyDialog
        open={Boolean(editingFolder)}
        value={editingFolder}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingFolderId(null);
          }
        }}
        onSave={(nextValue) =>
          setFolderStrategies((current) =>
            current.map((item) => (item.id === nextValue.id ? nextValue : item)),
          )
        }
      />
    </>
  );
}
