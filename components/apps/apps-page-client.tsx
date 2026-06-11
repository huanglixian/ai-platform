"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, RefreshCw, Trash2, X } from "lucide-react";

import { CardPageFrame } from "@/components/shared/card-page-frame";
import { getLocalApps, saveLocalApps } from "@/features/apps/mock-data";
import { AppType, PlatformSource, PublishedApp } from "@/features/apps/types";

const ITEM_WIDTH = 300;
const APP_TABS = ["全部", "原生", "Dify", "n8n"] as const;
const APP_GROUP_TABS = APP_TABS.filter((tab) => tab !== "全部");

const sourceLabels: Record<PlatformSource, (typeof APP_GROUP_TABS)[number]> = {
  native: "原生",
  dify: "Dify",
  n8n: "n8n",
};

const typeLabels: Record<AppType, string> = {
  business: "业务类应用",
  general: "通用类应用",
};

const sourceStyles: Record<PlatformSource, { bg: string; text: string; label: string }> = {
  native: { bg: "bg-violet-50 border-violet-200", text: "text-violet-700", label: "原生" },
  dify: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Dify" },
  n8n: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", label: "n8n" },
};

type AppCardProps = {
  app: PublishedApp;
  copied: boolean;
  onSelect: (app: PublishedApp) => void;
  onCopy: (id: string, appUrl: string, event: React.MouseEvent) => void;
  onDelete: (id: string, event: React.MouseEvent) => void;
};

function AppCard({ app, copied, onSelect, onCopy, onDelete }: AppCardProps) {
  const sourceStyle = sourceStyles[app.source];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(app)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(app);
        }
      }}
      className="group relative flex min-h-[170px] cursor-pointer flex-col justify-between rounded-xl border border-border bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span
              className={[
                "self-start rounded-full border px-1.5 py-0.5 text-[9px] font-bold",
                sourceStyle.bg,
                sourceStyle.text,
              ].join(" ")}
            >
              {sourceStyle.label}
            </span>
            <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-5 text-title transition-colors group-hover:text-primary">
              {app.name}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={(event) => onCopy(app.id, app.url, event)}
              className={[
                "flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-all hover:bg-slate-50 hover:text-primary",
                copied ? "bg-green-50 text-green-600" : "",
              ].join(" ")}
              title="复制应用链接"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            <button
              type="button"
              onClick={(event) => onDelete(app.id, event)}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-all hover:bg-destructive/5 hover:text-destructive"
              title="下线该应用"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <p className="mt-2.5 line-clamp-3 text-xs leading-5 text-muted-foreground">
          {app.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400">
        <span className="font-semibold text-slate-500">{typeLabels[app.appType]}</span>
        <span>发布于: {new Date(app.createdAt).toLocaleDateString("zh-CN")}</span>
      </div>
    </article>
  );
}

function EmptyApps() {
  return (
    <div
      className="flex min-h-[180px] flex-col items-center justify-center rounded-[10px] border border-dashed border-[#dbe5f0] bg-white px-4 text-center"
      style={{ gridColumn: "1 / -1" }}
    >
      <div className="text-[13px] font-semibold text-title">暂无已发布应用</div>
      <p className="mt-2 max-w-[280px] text-[12px] leading-5 text-muted-foreground">
        点击右侧按钮发布已有应用，聚合旧智能体资产。
      </p>
    </div>
  );
}

export function AppsPageClient() {
  const [list, setList] = useState<PublishedApp[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<PublishedApp | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof APP_TABS)[number]>("全部");
  const [keyword, setKeyword] = useState("");

  // Iframe 加载状态与重载 Key
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  // 复制提示状态
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 表单状态
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [source, setSource] = useState<PlatformSource>("native");
  const [appType, setAppType] = useState<AppType>("business");
  const [url, setUrl] = useState("");

  // 表单错误提示
  const [formError, setFormError] = useState("");

  useEffect(() => {
    // 异步加载本地数据，避免服务端渲染与本地存储状态不一致
    const timer = setTimeout(() => {
      setList(getLocalApps());
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function handleSelectApp(app: PublishedApp) {
    setSelectedApp(app);
    setIframeLoading(true);
    setIframeKey(0);
  }

  function handleCreate() {
    setFormError("");
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();

    if (!trimmedName) {
      setFormError("请输入应用名称");
      return;
    }
    if (!trimmedUrl) {
      setFormError("请输入应用访问链接 (URL)");
      return;
    }

    if (source !== "native" && !/^https?:\/\//i.test(trimmedUrl)) {
      setFormError("外部应用访问链接必须以 http:// 或 https:// 开头");
      return;
    }

    const newApp: PublishedApp = {
      id: `app-${Date.now()}`,
      name: trimmedName,
      description: desc.trim() || "暂无应用描述",
      source,
      appType,
      url: trimmedUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newApp, ...list];
    setList(updated);
    saveLocalApps(updated);
    setShowModal(false);
    setName("");
    setDesc("");
    setUrl("");
    setFormError("");
  }

  function handleDelete(id: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm("确定下线并删除该应用吗？")) return;
    const updated = list.filter((app) => app.id !== id);
    setList(updated);
    saveLocalApps(updated);
    if (selectedApp?.id === id) {
      setSelectedApp(null);
    }
  }

  function handleCopy(id: string, appUrl: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }).catch((err) => {
      console.error("复制失败:", err);
    });
  }

  function handleRefreshIframe() {
    setIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  const searchedApps = list.filter((app) => {
    if (!normalizedKeyword) {
      return true;
    }

    return (
      app.name.toLowerCase().includes(normalizedKeyword) ||
      app.description.toLowerCase().includes(normalizedKeyword) ||
      sourceLabels[app.source].toLowerCase().includes(normalizedKeyword) ||
      typeLabels[app.appType].toLowerCase().includes(normalizedKeyword)
    );
  });

  const visibleApps = searchedApps.filter((app) => {
    if (activeTab === "全部") {
      return true;
    }

    return sourceLabels[app.source] === activeTab;
  });

  const renderAppCard = (app: PublishedApp) => (
    <AppCard
      key={app.id}
      app={app}
      copied={copiedId === app.id}
      onSelect={handleSelectApp}
      onCopy={handleCopy}
      onDelete={handleDelete}
    />
  );

  const groupedApps = APP_GROUP_TABS.map((tab) => ({
    key: tab,
    title: tab,
    children: searchedApps
      .filter((app) => sourceLabels[app.source] === tab)
      .map(renderAppCard),
  })).filter((section) => section.children.length > 0);

  if (!mounted) {
    return (
      <div className="flex w-full flex-col gap-4">
        <div className="h-6 w-36 animate-pulse rounded-[8px] bg-[#e8eef5]" />
        <div className="h-[35px] w-[50%] min-w-[280px] self-center animate-pulse rounded-[10px] bg-[#e8eef5]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-[190px] animate-pulse rounded-[10px] bg-[#e8eef5]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <CardPageFrame
        title="应用中心"
        count={visibleApps.length}
        itemWidth={ITEM_WIDTH}
        actionLabel="发布已有应用"
        onActionClick={() => {
          setShowModal(true);
          setFormError("");
        }}
        tabs={[...APP_TABS]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as (typeof APP_TABS)[number])}
        groupedSections={groupedApps}
        searchValue={keyword}
        searchPlaceholder="搜索应用名称、描述、来源或类型"
        onSearchChange={setKeyword}
      >
        {visibleApps.length ? visibleApps.map(renderAppCard) : <EmptyApps />}
      </CardPageFrame>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[10px] border border-border bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="mb-4 text-sm font-bold text-title">发布已有应用</h3>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-xs text-rose-600">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">应用名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="如：客户工单摘要分派助手"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">来源平台</label>
                <select
                  value={source}
                  onChange={(event) => setSource(event.target.value as PlatformSource)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="native">原生</option>
                  <option value="dify">Dify</option>
                  <option value="n8n">n8n</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">应用类型</label>
                <select
                  value={appType}
                  onChange={(event) => setAppType(event.target.value as AppType)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="business">业务类应用</option>
                  <option value="general">通用类应用</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">应用访问链接 (URL)</label>
                <input
                  type="text"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="https://your-dify-app.com/chatbot"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">描述</label>
                <textarea
                  value={desc}
                  onChange={(event) => setDesc(event.target.value)}
                  className="min-h-[70px] w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="应用详细功能简介"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-105"
              >
                发布应用
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-xs">
          <div className="flex h-full w-[calc(100vw-280px)] flex-col border-l border-border bg-slate-50 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-white px-6 py-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-[#dbe5f0] bg-white px-2 py-0.5 text-[10px] text-[#51657d]">
                  {sourceLabels[selectedApp.source]}
                </span>
                <h3 className="text-sm font-bold text-title">{selectedApp.name}</h3>
                <span className="text-xs font-medium text-slate-400">运行环境</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedApp.url.startsWith("http") && (
                  <button
                    type="button"
                    onClick={handleRefreshIframe}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                    title="重新加载应用"
                  >
                    <RefreshCw size={14} className={iframeLoading ? "animate-spin" : ""} />
                    <span>刷新</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                >
                  <X size={14} />
                  <span>关闭应用</span>
                </button>
              </div>
            </div>

            <div className="relative flex-1 bg-white">
              {selectedApp.url.startsWith("http") ? (
                <>
                  {iframeLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-xs animate-in fade-in-50 duration-200">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative h-10 w-10">
                          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                          <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">应用载入中...</span>
                      </div>
                    </div>
                  )}
                  <iframe
                    key={`${selectedApp.id}-${iframeKey}`}
                    src={selectedApp.url}
                    onLoad={() => setIframeLoading(false)}
                    className="h-full w-full border-none"
                    title={selectedApp.name}
                    sandbox="allow-scripts allow-popups allow-forms"
                  />
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <div className="text-xs font-bold text-title">已拦截原生非外部地址</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    地址 {selectedApp.url} 为系统内部路由，请使用完整 http 链接进行外链聚合发布测试。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
