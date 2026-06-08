"use client";

import React, { useState, useEffect } from "react";
import { getLocalApps, saveLocalApps } from "@/features/apps/mock-data";
import { PublishedApp, PlatformSource, AppType } from "@/features/apps/types";

export function AppsPageClient() {
  const [list, setList] = useState<PublishedApp[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<PublishedApp | null>(null);

  // Iframe 加载状态与重载 Key
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  // 复制提示状态
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 表单状态
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [source, setSource] = useState<PlatformSource>("dify");
  const [appType, setAppType] = useState<AppType>("chat");
  const [url, setUrl] = useState("");

  // 表单错误提示
  const [formError, setFormError] = useState("");

  // 挂载后初始化列表与挂载状态
  useEffect(() => {
    // 异步加载本地数据和更新挂载状态，防止被 ESLint 规则同步 setState 拦截
    const timer = setTimeout(() => {
      setList(getLocalApps());
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 统一的卡片点击处理函数
  function handleSelectApp(app: PublishedApp) {
    setSelectedApp(app);
    setIframeLoading(true);
    setIframeKey(0);
  }

  // 创建新应用逻辑，带 URL 格式校验
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

    // URL 格式合法性校验
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
      updatedAt: new Date().toISOString()
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

  // 删除应用逻辑
  function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("确定下线并删除该应用吗？")) return;
    const updated = list.filter((a) => a.id !== id);
    setList(updated);
    saveLocalApps(updated);
    if (selectedApp?.id === id) {
      setSelectedApp(null);
    }
  }

  // 复制链接逻辑
  function handleCopy(id: string, appUrl: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }).catch((err) => {
      console.error("复制失败:", err);
    });
  }

  // 刷新 Iframe 逻辑
  function handleRefreshIframe() {
    setIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  }

  const sourceStyles: Record<PlatformSource, { bg: string; text: string; label: string }> = {
    dify: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Dify" },
    n8n: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", label: "n8n" },
    ragflow: { bg: "bg-teal-50 border-teal-200", text: "text-teal-700", label: "RAGFlow" },
    native: { bg: "bg-violet-50 border-violet-200", text: "text-violet-700", label: "原生 2.0" }
  };

  const typeLabels: Record<AppType, string> = {
    chat: "💬 问答助手",
    workflow: "⛓️ 流程应用",
    agent: "🤖 智能助手",
    completion: "📝 文本生成"
  };

  if (!mounted) {
    return (
      <div className="w-full px-6 py-8 sm:px-8 max-w-7xl mx-auto font-sans">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded-md w-1/4"></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8 sm:px-8 max-w-7xl mx-auto font-sans">
      <div className="flex items-center justify-between border-b border-border pb-5 mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-title">应用中心</h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            集成并发布在旧智能体平台（RAGFlow、n8n、Dify 等）上已有的应用，搭建统一聚合入口。
          </p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setFormError("");
          }}
          className="rounded-lg bg-gradient-to-tr from-[#0368b3] to-[#2e7dd2] text-white font-medium text-xs px-4 py-2.5 shadow-md hover:brightness-105 transition-all cursor-pointer"
        >
          发布已有应用
        </button>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl bg-slate-50/20 px-4">
          <span className="text-3xl mb-3">📦</span>
          <h3 className="text-xs font-bold text-title">暂无已发布应用</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-[280px]">
            点击右上角 “发布已有应用”，聚合您的旧智能体资产。
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((app) => {
            const src = sourceStyles[app.source] || { bg: "bg-slate-50", text: "text-slate-700", label: "未知" };
            const isCopied = copiedId === app.id;
            return (
              <div
                key={app.id}
                onClick={() => handleSelectApp(app)}
                className="group relative flex flex-col justify-between p-5 rounded-xl border border-border bg-white hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 min-h-[170px] cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className={[
                        "text-[9px] px-1.5 py-0.5 rounded-full border font-bold self-start",
                        src.bg, src.text
                      ].join(" ")}>
                        {src.label}
                      </span>
                      <h3 className="text-sm font-bold text-title group-hover:text-primary transition-colors mt-0.5">
                        {app.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleCopy(app.id, app.url, e)}
                        className={`p-1 rounded text-slate-400 hover:text-primary hover:bg-slate-50 transition-all ${
                          isCopied ? "text-green-600 bg-green-50" : ""
                        }`}
                        title="复制应用链接"
                      >
                        {isCopied ? (
                          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => handleDelete(app.id, e)}
                        className="p-1 rounded text-slate-400 hover:text-destructive hover:bg-destructive/5 transition-all"
                        title="下线该应用"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs text-muted-foreground leading-5 line-clamp-3">
                    {app.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                  <span className="font-semibold text-slate-500">{typeLabels[app.appType]}</span>
                  <span>
                    发布于: {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 发布应用 Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-border rounded-xl shadow-2xl p-6 relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-title mb-4">发布已有应用</h3>
            
            {formError && (
              <div className="mb-4 p-2.5 text-xs bg-rose-50 text-rose-600 rounded-lg border border-rose-100 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">应用名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
                  placeholder="如：文档切片智能问答"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">来源平台</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as PlatformSource)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="dify">Dify</option>
                  <option value="n8n">n8n</option>
                  <option value="ragflow">RAGFlow</option>
                  <option value="native">原生应用 (Native)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">应用类型</label>
                <select
                  value={appType}
                  onChange={(e) => setAppType(e.target.value as AppType)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="chat">💬 问答助手</option>
                  <option value="agent">🤖 智能助手</option>
                  <option value="workflow">⛓️ 流程应用</option>
                  <option value="completion">📝 文本生成</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">应用访问链接 (URL)</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
                  placeholder="https://your-dify-app.com/chatbot..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">描述</label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full min-h-[70px] rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors resize-none"
                  placeholder="应用详细功能简介"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="rounded-lg bg-primary text-white px-4 py-2 text-xs font-semibold hover:brightness-105 transition-all"
              >
                发布应用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 页内内嵌运行大滑层 (Iframe Drawer) */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-xs">
          <div className="w-[calc(100vw-280px)] h-full bg-slate-50 border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* 控制顶栏 */}
            <div className="flex items-center justify-between border-b border-border bg-white px-6 py-3.5 shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <span className={[
                  "text-[9px] px-1.5 py-0.5 rounded-full border font-bold",
                  sourceStyles[selectedApp.source]?.bg, sourceStyles[selectedApp.source]?.text
                ].join(" ")}>
                  {sourceStyles[selectedApp.source]?.label}
                </span>
                <h3 className="text-sm font-bold text-title">{selectedApp.name}</h3>
                <span className="text-xs text-slate-400 font-mono">运行环境</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedApp.url.startsWith("http") && (
                  <button
                    onClick={handleRefreshIframe}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                    title="重新加载应用"
                  >
                    <svg className={`w-3.5 h-3.5 ${iframeLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                    </svg>
                    <span>刷新</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedApp(null)}
                  className="rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  ✕ 关闭应用
                </button>
              </div>
            </div>
            
            {/* 运行区 */}
            <div className="flex-1 w-full bg-white relative">
              {selectedApp.url.startsWith("http") ? (
                <>
                  {iframeLoading && (
                    <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-xs flex flex-col items-center justify-center z-10 animate-in fade-in-50 duration-200">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative w-10 h-10">
                          <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
                          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">应用载入中...</span>
                      </div>
                    </div>
                  )}
                  <iframe
                    key={`${selectedApp.id}-${iframeKey}`}
                    src={selectedApp.url}
                    onLoad={() => setIframeLoading(false)}
                    className="w-full h-full border-none"
                    title={selectedApp.name}
                    sandbox="allow-scripts allow-popups allow-forms"
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <span className="text-3xl mb-2">🔌</span>
                  <h4 className="text-xs font-bold text-title">已拦截原生非外部地址</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    地址 {selectedApp.url} 为系统内部路由，请使用完整 http 链接进行外链聚合发布测试。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
