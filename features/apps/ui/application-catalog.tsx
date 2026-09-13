"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, LoaderCircle, Plus, Search, Trash2 } from "lucide-react";
import type { PlatformSource, PublishedApp } from "@/features/apps/types";
import { AppActionDrawer } from "./application-action-drawer";
import { AppCard } from "./application-card";
import { sourceLabels, typeLabels } from "./application-presentation";
import { ApplicationForm } from "./application-form";

function EmptyApps() {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 text-center">
      <div className="text-sm font-semibold text-title">没有找到应用</div>
      <p className="mt-2 max-w-[280px] text-xs leading-5 text-muted-foreground">可以调整搜索条件，或接入一个新的外部应用。</p>
    </div>
  );
}

type ApplicationGroupProps = {
  source: PlatformSource;
  apps: PublishedApp[];
  onAdd?: () => void;
  onSelect: (app: PublishedApp) => void;
  onOpen: (app: PublishedApp) => void;
  onRemove: (app: PublishedApp) => void;
};

function ApplicationGroup({ source, apps, onAdd, onSelect, onOpen, onRemove }: ApplicationGroupProps) {
  const compactGrid = source === "dify" || source === "n8n";

  return (
    <section aria-labelledby={`application-group-${source}`} className="min-w-0 overflow-hidden rounded-xl border border-[#dce5ed] bg-white shadow-[0_2px_8px_rgba(28,52,77,0.025)]">
      <header className="flex h-10 items-center gap-2.5 border-b border-[#e2eaf1] bg-gradient-to-r from-[#edf4f9] to-[#f8fafc] px-3.5">
        <span aria-hidden="true" className="h-3.5 w-[3px] rounded-full bg-[#5a86ab]" />
        <h2 id={`application-group-${source}`} className="text-[14px] font-semibold tracking-[0.01em] text-[#294b69]">{sourceLabels[source]}</h2>
        {onAdd ? <button type="button" onClick={onAdd} className="ml-auto inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-[#477395] transition-colors hover:bg-white hover:text-[#155b91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a86ab]"><Plus size={14} />接入应用</button> : null}
      </header>
      {apps.length ? (
        <div className={compactGrid ? "grid gap-2 p-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" : "grid gap-2 p-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
          {apps.map((app) => <AppCard key={app.id} app={app} onSelect={onSelect} onOpen={onOpen} onRemove={onRemove} />)}
        </div>
      ) : <div className="px-4 py-5 text-center text-[12px] text-[#8095a9]">暂无应用</div>}
    </section>
  );
}

export function ApplicationCatalog() {
  const [list, setList] = useState<PublishedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedApp, setSelectedApp] = useState<PublishedApp | null>(null);
  const [editingApp, setEditingApp] = useState<PublishedApp | null | undefined>(undefined);
  const [newApplicationSource, setNewApplicationSource] = useState<"external" | "dify" | "n8n">("external");
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

  function openApplicationForm(source: "external" | "dify" | "n8n") {
    setNewApplicationSource(source);
    setEditingApp(null);
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

  const groups = {
    appfactory: searchedApps.filter((app) => app.source === "appfactory"),
    external: searchedApps.filter((app) => app.source === "external"),
    dify: searchedApps.filter((app) => app.source === "dify"),
    n8n: searchedApps.filter((app) => app.source === "n8n"),
  };
  const hasSearch = Boolean(keyword.trim());

  if (loading) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-slate-100" />)}</div>;
  }

  return (
    <>
      <section id="applications" className="scroll-mt-24">
        {loadError ? <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"><AlertTriangle size={15} />{loadError}</div> : null}
        {removeError ? <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"><AlertTriangle size={15} />{removeError}</div> : null}
        <div className="mb-3 flex items-center">
          <label className="flex h-[34px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#dce5ed] bg-white px-3 transition-colors focus-within:border-[#86add5] focus-within:ring-2 focus-within:ring-[#eaf3fc]">
            <Search size={16} className="shrink-0 text-[#7890a8]" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索应用"
              aria-label="搜索应用"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-title outline-none placeholder:text-[#9aaabc]"
            />
          </label>
        </div>
        {searchedApps.length || !hasSearch ? (
          <div className="space-y-3">
            {!hasSearch || groups.appfactory.length ? <ApplicationGroup source="appfactory" apps={groups.appfactory} onSelect={handleSelect} onOpen={handleOpen} onRemove={requestRemove} /> : null}
            {!hasSearch || groups.external.length ? <ApplicationGroup source="external" apps={groups.external} onAdd={() => openApplicationForm("external")} onSelect={handleSelect} onOpen={handleOpen} onRemove={requestRemove} /> : null}
            {!hasSearch || groups.dify.length || groups.n8n.length ? <div className="grid items-start gap-3 lg:grid-cols-2">
              {!hasSearch || groups.dify.length ? <ApplicationGroup source="dify" apps={groups.dify} onAdd={() => openApplicationForm("dify")} onSelect={handleSelect} onOpen={handleOpen} onRemove={requestRemove} /> : null}
              {!hasSearch || groups.n8n.length ? <ApplicationGroup source="n8n" apps={groups.n8n} onAdd={() => openApplicationForm("n8n")} onSelect={handleSelect} onOpen={handleOpen} onRemove={requestRemove} /> : null}
            </div> : null}
          </div>
        ) : <EmptyApps />}
      </section>
      {editingApp !== undefined ? <ApplicationForm key={editingApp?.id ?? "new"} app={editingApp} source={newApplicationSource} onClose={() => setEditingApp(undefined)} onSaved={handleSaved} /> : null}
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
