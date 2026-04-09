"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmbeddingSettingsPanel } from "@/knowhub/components/settings/embedding-settings-panel";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { StrategyStageEditor } from "@/knowhub/components/knowledge/strategy-stage-editor";
import { createGlobalStrategyTemplate } from "@/knowhub/features/knowledge/builder-data";
import type { KnowledgeFileTypeKey } from "@/knowhub/features/knowledge/builder-types";

export function GlobalStrategyPage() {
  const [activeFileType, setActiveFileType] = useState<KnowledgeFileTypeKey>("markdown");
  const [fileTypes, setFileTypes] = useState(createGlobalStrategyTemplate());
  const [expanded, setExpanded] = useState(true);
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
              这里维护系统默认的建库策略模板。新建知识库时，会先引用这里的配置，再允许在当前知识库里局部调整。
            </div>
          </div>
          <Button>保存全局策略</Button>
        </div>
      </section>

      <EmbeddingSettingsPanel />

      <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <div className="text-title text-[15px] font-semibold">全局默认策略</div>
            <div className="mt-1 text-[12px] leading-5 text-[#667085]">
              默认模板会在新建知识库时被引用，再允许按当前知识库继续调整。
            </div>
          </div>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-[#667085]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#667085]" />
          )}
        </button>

        {expanded && activeConfig ? (
          <div className="mt-4">
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

            <div className="mt-4">
              <StrategyStageEditor
                value={activeConfig}
                onChange={(nextValue) =>
                  setFileTypes((current) =>
                    current.map((item) => (item.key === nextValue.key ? nextValue : item)),
                  )
                }
              />
            </div>
          </div>
        ) : null}
      </section>
    </KnowHubPageShell>
  );
}
