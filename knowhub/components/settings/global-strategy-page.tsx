"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { StrategyStageEditor } from "@/knowhub/components/knowledge/strategy-stage-editor";
import { createGlobalStrategyTemplate } from "@/knowhub/features/knowledge/builder-data";
import type { KnowledgeFileTypeKey } from "@/knowhub/features/knowledge/builder-types";

export function GlobalStrategyPage() {
  const [activeFileType, setActiveFileType] = useState<KnowledgeFileTypeKey>("word");
  const [fileTypes, setFileTypes] = useState(createGlobalStrategyTemplate());
  const activeConfig =
    fileTypes.find((item) => item.key === activeFileType) ?? fileTypes[0];

  return (
    <KnowHubPageShell>
      <section className="rounded-[18px] border border-[#d8e1eb] bg-[linear-gradient(180deg,rgba(237,242,248,0.96)_0%,rgba(246,249,253,0.98)_100%)] px-5 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-title text-[20px] font-semibold tracking-[-0.03em]">
              全局策略配置
            </div>
            <div className="mt-1 text-[13px] leading-6 text-[#667085]">
              这里维护系统默认的建库策略模板。新建知识库任务时，会先引用这里的配置，再允许在任务中局部调整。
            </div>
          </div>
          <Button>保存全局策略</Button>
        </div>
      </section>

      <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4">
        <div className="flex flex-wrap gap-2">
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
            <div className="mb-3 rounded-[14px] border border-[#e7edf4] bg-[#f8fbfe] px-4 py-3 text-[12px] text-[#667085]">
              {activeConfig.hint}
            </div>

            <StrategyStageEditor
              value={activeConfig}
              onChange={(nextValue) =>
                setFileTypes((current) =>
                  current.map((item) => (item.key === nextValue.key ? nextValue : item)),
                )
              }
            />
          </div>
        ) : null}
      </section>
    </KnowHubPageShell>
  );
}
