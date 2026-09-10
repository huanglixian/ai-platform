"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { CardPageFrame } from "@/components/shared/card-page-frame";
import type { PublishedApp } from "@/features/apps/types";
import { AppActionDrawer } from "./app-action-drawer";
import { AppCard } from "./app-card";
import { APP_GROUP_TABS, APP_TABS, sourceLabels, typeLabels } from "./app-presentation";
import { ExternalAppForm } from "./external-app-form";

const ITEM_WIDTH = 260;

function EmptyApps() {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 text-center" style={{ gridColumn: "1 / -1" }}>
      <div className="text-sm font-semibold text-title">没有找到应用</div>
      <p className="mt-2 max-w-[280px] text-xs leading-5 text-muted-foreground">可以调整搜索条件，或接入一个新的外部应用。</p>
    </div>
  );
}

export function AppsPageClient() {
  const [list, setList] = useState<PublishedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedApp, setSelectedApp] = useState<PublishedApp | null>(null);
  const [editingApp, setEditingApp] = useState<PublishedApp | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<(typeof APP_TABS)[number]>("全部");
  const [keyword, setKeyword] = useState("");
  const [pendingAction, setPendingAction] = useState<"start" | "stop" | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    async function loadApplications() {
      try {
        const response = await fetch("/api/agenthub/v1/applications");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "应用列表加载失败");
        setList(payload.data ?? []);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "应用列表加载失败");
      } finally {
        setLoading(false);
      }
    }
    void loadApplications();
  }, []);

  function replaceApplication(updated: PublishedApp) {
    setList((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelectedApp((current) => current?.id === updated.id ? updated : current);
  }

  async function handleServiceAction(app: PublishedApp, action: "start" | "stop") {
    setPendingAction(action);
    setActionError("");
    try {
      const response = await fetch(`/api/agenthub/v1/applications/${app.id}/${action}`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "服务操作失败");
      replaceApplication(payload.data);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "服务操作失败");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRemove(app: PublishedApp) {
    if (!window.confirm(`确定移除“${app.name}”吗？由应用中心启动的服务会同时停止。`)) return;
    setActionError("");
    try {
      const response = await fetch(`/api/agenthub/v1/applications/${app.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "移除应用失败");
      setList((current) => current.filter((item) => item.id !== app.id));
      setSelectedApp(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "移除应用失败");
    }
  }

  function handleOpen(app: PublishedApp) {
    window.open(app.url, "_blank", "noopener,noreferrer");
  }

  function handleSaved(app: PublishedApp, isNew: boolean) {
    setList((current) => isNew ? [app, ...current] : current.map((item) => item.id === app.id ? app : item));
    setSelectedApp((current) => current?.id === app.id ? app : current);
    setEditingApp(undefined);
  }

  const searchedApps = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return list;
    return list.filter((app) => (
      app.name.toLowerCase().includes(normalizedKeyword)
      || app.description.toLowerCase().includes(normalizedKeyword)
      || sourceLabels[app.source].toLowerCase().includes(normalizedKeyword)
      || typeLabels[app.appType].toLowerCase().includes(normalizedKeyword)
    ));
  }, [keyword, list]);

  const visibleApps = activeTab === "全部" ? searchedApps : searchedApps.filter((app) => sourceLabels[app.source] === activeTab);
  const groupedApps = APP_GROUP_TABS.map((tab) => ({
    key: tab,
    title: tab,
    children: searchedApps.filter((app) => sourceLabels[app.source] === tab).map((app) => <AppCard key={app.id} app={app} onSelect={(selected) => { setActionError(""); setSelectedApp(selected); }} />),
  })).filter((section) => section.children.length > 0);

  if (loading) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-xl bg-slate-100" />)}</div>;
  }

  return (
    <>
      {loadError ? <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"><AlertTriangle size={15} />{loadError}</div> : null}
      <CardPageFrame title="应用中心" count={visibleApps.length} itemWidth={ITEM_WIDTH} actionLabel="接入应用" onActionClick={() => setEditingApp(null)} tabs={[...APP_TABS]} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as (typeof APP_TABS)[number])} groupedSections={groupedApps} searchValue={keyword} searchPlaceholder="搜索应用名称、说明、来源或类型" onSearchChange={setKeyword}>
        {visibleApps.length ? visibleApps.map((app) => <AppCard key={app.id} app={app} onSelect={(selected) => { setActionError(""); setSelectedApp(selected); }} />) : <EmptyApps />}
      </CardPageFrame>
      {editingApp !== undefined ? <ExternalAppForm key={editingApp?.id ?? "new"} app={editingApp} onClose={() => setEditingApp(undefined)} onSaved={handleSaved} /> : null}
      {selectedApp ? <AppActionDrawer app={selectedApp} pendingAction={pendingAction} error={actionError} onClose={() => setSelectedApp(null)} onOpen={handleOpen} onStart={(app) => void handleServiceAction(app, "start")} onStop={(app) => void handleServiceAction(app, "stop")} onEdit={(app) => { setSelectedApp(null); setEditingApp(app); }} onRemove={(app) => void handleRemove(app)} /> : null}
    </>
  );
}
