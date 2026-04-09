"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { RetrievalResultsPanel } from "@/knowhub/components/retrieval/retrieval-results-panel";
import type { PipelineRecord } from "@/knowhub/features/knowledge/types";
import type { RetrievalSearchResult } from "@/knowhub/features/retrieval/types";

export function KnowHubRetrievalPage() {
  const [knowledgeItems, setKnowledgeItems] = useState<PipelineRecord[]>([]);
  const [knowledgeId, setKnowledgeId] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RetrievalSearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadKnowledgeItems() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/knowhub/knowledge", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
          items?: PipelineRecord[];
        };

        if (!response.ok || !payload.ok || !payload.items) {
          throw new Error(payload.error || "加载知识库列表失败");
        }

        if (cancelled) {
          return;
        }

        const publishedItems = payload.items.filter((item) => item.status === "published");
        setKnowledgeItems(publishedItems);
        setKnowledgeId((current) => current || publishedItems[0]?.id || "");
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "加载知识库列表失败");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadKnowledgeItems();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSearch() {
    if (!knowledgeId) {
      setError("请先选择一个已完成建库的知识库");
      return;
    }

    if (!query.trim()) {
      setError("请输入检索问题");
      return;
    }

    setSearching(true);
    setError("");

    try {
      setHasSearched(true);
      const response = await fetch("/api/knowhub/retrieval/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          knowledgeId,
          query: query.trim(),
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        result?: RetrievalSearchResult;
      };

      if (!response.ok || !payload.ok || !payload.result) {
        throw new Error(payload.error || "检索失败");
      }

      setResult(payload.result);
    } catch (nextError) {
      setResult(null);
      setError(nextError instanceof Error ? nextError.message : "检索失败");
    } finally {
      setSearching(false);
    }
  }

  return (
    <KnowHubPageShell>
      <section className="rounded-[18px] border border-[#d8e1eb] bg-[linear-gradient(180deg,rgba(237,242,248,0.96)_0%,rgba(246,249,253,0.98)_100%)] px-5 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <div className="text-title text-[20px] font-semibold tracking-[-0.03em]">
          检索验证
        </div>
        <div className="mt-1 text-[13px] leading-6 text-[#667085]">
          这里直接验证知识库的向量召回效果，后续 Workbench 搜索模式会复用同一条检索 API。
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[260px_minmax(0,1fr)_120px]">
          <div>
            <div className="mb-1 text-[12px] text-[#5f6f82]">知识库</div>
            <select
              value={knowledgeId}
              onChange={(event) => setKnowledgeId(event.target.value)}
              disabled={loading || searching || !knowledgeItems.length}
              className="h-8 w-full rounded-[10px] border border-[#cfd8e3] bg-white px-3 text-[13px] outline-none transition-colors focus:border-[#2e7dd2]"
            >
              <option value="">请选择知识库</option>
              {knowledgeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1 text-[12px] text-[#5f6f82]">问题</div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例如：设计知识库里有哪些页面布局规范？"
              disabled={loading || searching}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              disabled={loading || searching || !knowledgeItems.length}
              className="w-full"
            >
              {searching ? "检索中..." : "开始检索"}
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[16px] border border-[#f0d2d2] bg-[#fff8f8] px-4 py-3 text-[13px] text-[#a33a3a]">
          {error}
        </div>
      ) : null}

      <RetrievalResultsPanel visible={hasSearched} items={result?.items ?? []} />
    </KnowHubPageShell>
  );
}
