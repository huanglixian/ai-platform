"use client";

import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { EmbeddingSettingsPanel } from "@/knowhub/components/settings/embedding-settings-panel";

export function EmbeddingSettingsPage() {
  return (
    <KnowHubPageShell>
      <section className="rounded-[18px] border border-[#d8e1eb] bg-[linear-gradient(180deg,rgba(237,242,248,0.96)_0%,rgba(246,249,253,0.98)_100%)] px-5 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <div className="text-title text-[20px] font-semibold tracking-[-0.03em]">
          Embedding 配置
        </div>
        <div className="mt-1 text-[13px] leading-6 text-[#667085]">
          这里维护知识库建库和检索使用的向量化接口。Platform 只调用 KnowHub
          检索 API，不直接感知这套配置。
        </div>
      </section>

      <EmbeddingSettingsPanel />
    </KnowHubPageShell>
  );
}
