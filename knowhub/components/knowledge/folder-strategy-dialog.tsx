"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StrategyStageEditor } from "@/knowhub/components/knowledge/strategy-stage-editor";
import type {
  FolderStrategyDraft,
  KnowledgeFileTypeKey,
} from "@/knowhub/features/knowledge/builder-types";

type FolderStrategyDialogProps = {
  open: boolean;
  value: FolderStrategyDraft | null;
  onOpenChange: (open: boolean) => void;
  onSave: (nextValue: FolderStrategyDraft) => void;
};

export function FolderStrategyDialog({
  open,
  value,
  onOpenChange,
  onSave,
}: FolderStrategyDialogProps) {
  const [draft, setDraft] = useState<FolderStrategyDraft | null>(value);
  const [activeFileType, setActiveFileType] = useState<KnowledgeFileTypeKey>("word");

  useEffect(() => {
    setDraft(value);
    setActiveFileType("word");
  }, [value]);

  if (!open || !draft) {
    return null;
  }

  const activeConfig =
    draft.fileTypes.find((item) => item.key === activeFileType) ?? draft.fileTypes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.28)] px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[calc(100vh-48px)] w-full max-w-[920px] flex-col overflow-hidden rounded-[18px] border border-[#d6e0eb] bg-[linear-gradient(180deg,rgba(248,250,253,0.98)_0%,rgba(255,255,255,0.98)_100%)] shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#e7edf4] px-5 py-4">
          <div>
            <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
              文件夹策略配置
            </div>
            <div className="mt-1 text-[13px] leading-6 text-[#667085]">
              作用域：{draft.docspaceName} / {draft.path}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-[10px] border border-[#dbe5f0] p-2 text-[#667085] transition-colors hover:border-[#c7d8ea] hover:text-title"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="rounded-[14px] border border-[#d9ead5] bg-[#f6fff2] px-4 py-3 text-[12px] leading-5 text-[#4d6b3c]">
            当前文件夹策略默认继承全局策略。你在这里的调整，仅对该文件夹域内的数据生效。
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {draft.fileTypes.map((item) => {
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
              <div className="mb-3 rounded-[14px] border border-[#e7edf4] bg-[#f8fbfe] px-4 py-3 text-[12px] text-[#667085]">
                {activeConfig.hint}
              </div>
              <StrategyStageEditor
                value={activeConfig}
                onChange={(nextValue) =>
                  setDraft({
                    ...draft,
                    fileTypes: draft.fileTypes.map((item) =>
                      item.key === nextValue.key ? nextValue : item,
                    ),
                  })
                }
              />
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#e7edf4] px-5 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            保存文件夹策略
          </Button>
        </div>
      </div>
    </div>
  );
}
