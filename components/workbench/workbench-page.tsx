"use client";

import { useEffect, useState } from "react";

import { WorkbenchEmptyState } from "@/components/workbench/workbench-empty-state";
import { WorkbenchSearchResultPane } from "@/components/workbench/workbench-search-result-pane";
import {
  listWorkbenchKnowledgeOptions,
  searchWorkbenchKnowledge,
  type WorkbenchKnowledgeOption,
  type WorkbenchSearchResult,
} from "@/features/workbench/api";

type WorkbenchMode = "search" | "chat";

export function WorkbenchPage() {
  const [mode, setMode] = useState<WorkbenchMode>("chat");
  const [knowledgeOptions, setKnowledgeOptions] = useState<WorkbenchKnowledgeOption[]>([]);
  const [knowledgeId, setKnowledgeId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searchResult, setSearchResult] = useState<WorkbenchSearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [chatStatus, setChatStatus] = useState("能力推荐待接入，下一步将接入 DeepSeek-V4。");

  async function handleSearch(content: string) {
    const query = content.trim();

    if (!knowledgeId) {
      setSearchError("请先选择一个知识库");
      return;
    }

    if (!query) {
      setSearchError("请输入检索问题");
      return;
    }

    setSearching(true);
    setHasSearched(true);
    setSearchError("");
    setSearchStatus("正在检索相关片段...");

    try {
      const result = await searchWorkbenchKnowledge({
        knowledgeId,
        query,
      });
      setSearchResult(result);
      setSearchInput(query);
      setSearchStatus(result.items.length ? `已召回 ${result.items.length} 个片段` : "未找到相关片段");
    } catch (searchLoadError) {
      setSearchResult(null);
      setSearchStatus("");
      setSearchError(
        searchLoadError instanceof Error ? searchLoadError.message : "检索失败，请重试",
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleChatPlaceholder() {
    setChatStatus("能力推荐待接入：当前先保留入口，不调用旧服务。");
  }

  function handleModeChange(nextMode: WorkbenchMode) {
    setMode(nextMode);
    if (nextMode === "chat") {
      setSearchError("");
      setSearchStatus("");
    }
  }

  useEffect(() => {
    let active = true;

    async function loadKnowledgeOptions() {
      try {
        const items = await listWorkbenchKnowledgeOptions();

        if (!active) {
          return;
        }

        setKnowledgeOptions(items);
        setKnowledgeId((current) => current || items[0]?.id || "");
      } catch (loadError) {
        if (!active) {
          return;
        }

        setSearchError(
          loadError instanceof Error ? loadError.message : "知识库加载失败",
        );
      }
    }

    void loadKnowledgeOptions();

    return () => {
      active = false;
    };
  }, []);

  const showSearchWorkspace = mode === "search" && hasSearched;
  const selectedKnowledge =
    knowledgeOptions.find((item) => item.id === knowledgeId) ?? null;

  if (!showSearchWorkspace) {
    return (
      <section className="-ml-6 h-[calc(100vh-104px)] min-h-0 w-[calc(100%+1.5rem)] overflow-hidden rounded-[18px] bg-white px-5 py-4 sm:-ml-8 sm:w-[calc(100%+2rem)]">
        <WorkbenchEmptyState
          mode={mode}
          knowledgeId={knowledgeId}
          knowledgeOptions={knowledgeOptions}
          sending={mode === "chat" ? false : searching}
          status={mode === "chat" ? chatStatus : searchStatus}
          onModeChange={handleModeChange}
          onKnowledgeChange={setKnowledgeId}
          onSend={mode === "chat" ? handleChatPlaceholder : handleSearch}
        />
      </section>
    );
  }

  return (
    <section className="-ml-6 h-[calc(100vh-104px)] min-h-0 w-[calc(100%+1.5rem)] py-1 sm:-ml-8 sm:w-[calc(100%+2rem)]">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-[18px] bg-white px-5 py-4">
        <section className="app-card-no-hover overflow-hidden">
          <div className="border-b border-[#eef2f6] px-4 py-3">
            <div className="text-[15px] font-semibold text-title">知识检索</div>
          </div>
          <div className="grid gap-3 px-4 py-4">
            <textarea
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="输入问题，搜索知识库中的相关片段"
              className="min-h-[92px] resize-none rounded-[12px] border border-[#dbe5f0] bg-white px-4 py-3 text-[13px] leading-6 text-title outline-none transition-colors placeholder:text-[#98a2b3] focus:border-[#6f96c4]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 text-[12px] text-[#7f8ea3]">
                <select
                  value={knowledgeId}
                  onChange={(event) => setKnowledgeId(event.target.value)}
                  className="h-[32px] min-w-[220px] rounded-[8px] border border-[#dbe5f0] bg-white px-2.5 text-[12px] text-title outline-none transition-colors focus:border-[#6f96c4]"
                >
                  <option value="">请选择知识库</option>
                  {knowledgeOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <div className="truncate">{searchStatus || "通过问题召回相关片段和文档索引"}</div>
              </div>
              <button
                type="button"
                disabled={searching}
                onClick={() => void handleSearch(searchInput)}
                className="h-[36px] rounded-[8px] bg-[#0368b3] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:bg-[#7eaed6]"
              >
                {searching ? "搜索中..." : "搜索"}
              </button>
            </div>
          </div>
        </section>

        <WorkbenchSearchResultPane
          searching={searching}
          query={searchResult?.query || ""}
          knowledgeName={selectedKnowledge?.name || ""}
          hasSearched={hasSearched}
          error={searchError}
          items={searchResult?.items ?? []}
        />
      </div>
    </section>
  );
}
