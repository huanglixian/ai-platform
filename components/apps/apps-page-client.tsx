"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
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
  const [removingApp, setRemovingApp] = useState<PublishedApp | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");

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
    if (action === "start") replaceApplication({ ...app, launchStatus: "starting" });
    try {
      const response = await fetch(`/api/agenthub/v1/applications/${app.id}/${action}`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "服务操作失败");
      replaceApplication(payload.data);
    } catch (error) {
      if (action === "start") replaceApplication({ ...app, launchStatus: null });
      setActionError(error instanceof Error ? error.message : "服务操作失败");
    } finally {
      setPendingAction(null);
    }
  }

  async function confirmRemove() {
    if (!removingApp) return;
    setRemoving(true);
    setRemoveError("");
    try {
      const response = await fetch(`/api/agenthub/v1/applications/${removingApp.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "移除应用失败");
      setList((current) => current.filter((item) => item.id !== removingApp.id));
      setSelectedApp((current) => current?.id === removingApp.id ? null : current);
      setRemovingApp(null);
    } catch (error) {
      setRemoveError(error instanceof Error ? error.message : "移除应用失败");
    } finally {
      setRemoving(false);
    }
  }

  function handleOpen(app: PublishedApp) {
    window.open(app.url, "_blank", "noopener,noreferrer");
  }

  function handleSelect(app: PublishedApp) {
    setActionError("");
    if (app.source === "appfactory") {
      handleOpen(app);
      return;
    }
    setSelectedApp(app);
  }

  function requestRemove(app: PublishedApp) {
    setRemoveError("");
    setRemovingApp(app);
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
    children: searchedApps.filter((app) => sourceLabels[app.source] === tab).map((app) => <AppCard key={app.id} app={app} onSelect={handleSelect} onRemove={requestRemove} />),
  })).filter((section) => section.children.length > 0);

  if (loading) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-xl bg-slate-100" />)}</div>;
  }

  return (
    <>
      {loadError ? <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"><AlertTriangle size={15} />{loadError}</div> : null}
      {removeError ? <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"><AlertTriangle size={15} />{removeError}</div> : null}
      <CardPageFrame title="应用中心" count={visibleApps.length} itemWidth={ITEM_WIDTH} actionLabel="接入应用" onActionClick={() => setEditingApp(null)} tabs={[...APP_TABS]} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as (typeof APP_TABS)[number])} groupedSections={groupedApps} searchValue={keyword} searchPlaceholder="搜索应用名称、说明、来源或类型" onSearchChange={setKeyword}>
        {visibleApps.length ? visibleApps.map((app) => <AppCard key={app.id} app={app} onSelect={handleSelect} onRemove={requestRemove} />) : <EmptyApps />}
      </CardPageFrame>
      {editingApp !== undefined ? <ExternalAppForm key={editingApp?.id ?? "new"} app={editingApp} onClose={() => setEditingApp(undefined)} onSaved={handleSaved} /> : null}
      {selectedApp ? <AppActionDrawer app={selectedApp} pendingAction={pendingAction} error={actionError} onClose={() => setSelectedApp(null)} onOpen={handleOpen} onStart={(app) => void handleServiceAction(app, "start")} onStop={(app) => void handleServiceAction(app, "stop")} onEdit={(app) => { setSelectedApp(null); setEditingApp(app); }} onRemove={requestRemove} /> : null}
      <Dialog.Root open={removingApp !== null} onOpenChange={(open) => { if (!open && !removing) setRemovingApp(null); }}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[60] bg-slate-950/35 backdrop-blur-[1px]" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-[61] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl focus:outline-none">
            <Dialog.Title className="text-base font-bold text-title">删除应用</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-slate-600">确定删除“{removingApp?.name}”吗？{removingApp?.source === "appfactory" ? "已发布的运行时会停止，但 AppFactory 项目和发布历史会保留。" : removingApp?.source === "external" ? "由应用中心启动的服务会一并停止。" : "该应用注册记录会从应用中心删除。"}</Dialog.Description>
            {removeError ? <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">{removeError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close disabled={removing} className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">取消</Dialog.Close>
              <button type="button" onClick={() => void confirmRemove()} disabled={removing} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">{removing ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}删除</button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
