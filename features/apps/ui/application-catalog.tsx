"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, LoaderCircle, Plus, Search, Trash2 } from "lucide-react";
import type { PlatformSource, PublishedApp } from "@/features/apps/types";
import { AppCard } from "./application-card";
import { sourceLabels, typeLabels } from "./application-presentation";
import { ApplicationForm } from "./application-form";

type ApplicationFilter = "all" | PlatformSource;

const sourceFilters: { value: ApplicationFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "appfactory", label: "AppFactory" },
  { value: "external", label: "外部应用" },
  { value: "dify", label: "Dify" },
  { value: "n8n", label: "n8n" },
];

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
  pendingService: { appId: string; action: "start" | "stop" } | null;
  onOpen: (app: PublishedApp) => void;
  onEdit: (app: PublishedApp) => void;
  onServiceAction: (app: PublishedApp, action: "start" | "stop") => void;
  onRemove: (app: PublishedApp) => void;
};

function ApplicationGroup({ source, apps, onAdd, pendingService, onOpen, onEdit, onServiceAction, onRemove }: ApplicationGroupProps) {
  const compactGrid = source === "dify" || source === "n8n";

  return (
    <section aria-labelledby={`application-group-${source}`} className="min-w-0 overflow-hidden rounded-xl border border-[#cdd9e4] bg-[#f6f8fa] shadow-[0_3px_12px_rgba(28,52,77,0.04)]">
      <header className="flex h-10 items-center gap-2.5 border-b border-[#cbdfee] bg-[linear-gradient(105deg,#d5eafa_0%,#e6f2fb_48%,#f3f8fc_100%)] px-3.5">
        <span aria-hidden="true" className="h-3.5 w-[3px] rounded-full bg-[#315f84]" />
        <h2 id={`application-group-${source}`} className="text-[14px] font-semibold tracking-[0.01em] text-[#203f5c]">{sourceLabels[source]}</h2>
        {onAdd ? <button type="button" onClick={onAdd} className="ml-auto inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-[#477395] transition-colors hover:bg-white hover:text-[#155b91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a86ab]"><Plus size={14} />接入应用</button> : null}
      </header>
      {apps.length ? (
        <div className={compactGrid ? "grid gap-2 p-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" : "grid gap-2 p-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
          {apps.map((app) => <AppCard key={app.id} app={app} pendingAction={pendingService?.appId === app.id ? pendingService.action : null} onOpen={onOpen} onEdit={onEdit} onServiceAction={onServiceAction} onRemove={onRemove} />)}
        </div>
      ) : <div className="px-4 py-5 text-center text-[12px] text-[#8095a9]">暂无应用</div>}
    </section>
  );
}

export function ApplicationCatalog() {
  const [list, setList] = useState<PublishedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingApp, setEditingApp] = useState<PublishedApp | null | undefined>(undefined);
  const [newApplicationSource, setNewApplicationSource] = useState<"external" | "dify" | "n8n">("external");
  const [sourceFilter, setSourceFilter] = useState<ApplicationFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [pendingService, setPendingService] = useState<{ appId: string; action: "start" | "stop" } | null>(null);
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
  }

  async function handleServiceAction(app: PublishedApp, action: "start" | "stop") {
    setPendingService({ appId: app.id, action });
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
      setPendingService(null);
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
    setEditingApp(undefined);
  }

  const searchedApps = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return list.filter((app) => (
      (sourceFilter === "all" || app.source === sourceFilter)
      && (!normalizedKeyword
        || app.name.toLowerCase().includes(normalizedKeyword)
        || app.description.toLowerCase().includes(normalizedKeyword)
        || sourceLabels[app.source].toLowerCase().includes(normalizedKeyword)
        || typeLabels[app.appType].toLowerCase().includes(normalizedKeyword))
    ));
  }, [keyword, list, sourceFilter]);

  const groups = {
    appfactory: searchedApps.filter((app) => app.source === "appfactory"),
    external: searchedApps.filter((app) => app.source === "external"),
    dify: searchedApps.filter((app) => app.source === "dify"),
    n8n: searchedApps.filter((app) => app.source === "n8n"),
  };
  const hasSearch = Boolean(keyword.trim());

  function renderGroup(source: PlatformSource) {
    return (
      <ApplicationGroup
        source={source}
        apps={groups[source]}
        onAdd={source === "appfactory" ? undefined : () => openApplicationForm(source)}
        pendingService={pendingService}
        onOpen={handleOpen}
        onEdit={setEditingApp}
        onServiceAction={handleServiceAction}
        onRemove={requestRemove}
      />
    );
  }

  if (loading) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-slate-100" />)}</div>;
  }

  return (
    <>
      <section id="applications" className="scroll-mt-24">
        {loadError ? <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"><AlertTriangle size={15} />{loadError}</div> : null}
        {actionError ? <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"><AlertTriangle size={15} />{actionError}</div> : null}
        {removeError ? <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"><AlertTriangle size={15} />{removeError}</div> : null}
        <div className="mb-3 flex min-w-0 items-center gap-3 overflow-x-auto pb-px">
          <div role="group" aria-label="应用来源筛选" className="inline-flex h-[34px] shrink-0 items-center rounded-lg border border-[#d4e0ea] bg-[#eaf1f7] p-[3px] shadow-[inset_0_1px_2px_rgba(35,66,92,0.04)]">
            {sourceFilters.map((filter) => <button key={filter.value} type="button" aria-pressed={sourceFilter === filter.value} onClick={() => setSourceFilter(filter.value)} className={`h-[26px] rounded-md px-3 text-[11px] font-medium transition-[color,background-color,box-shadow] ${sourceFilter === filter.value ? "bg-white text-[#205f8d] shadow-[0_1px_4px_rgba(28,65,94,0.12)]" : "text-[#71869a] hover:text-[#315f84]"}`}>{filter.label}</button>)}
          </div>
          <label className="flex h-[34px] min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#dce5ed] bg-white px-3 transition-colors focus-within:border-[#86add5] focus-within:ring-2 focus-within:ring-[#eaf3fc]">
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
            {(sourceFilter === "all" || sourceFilter === "appfactory") && (!hasSearch || groups.appfactory.length) ? renderGroup("appfactory") : null}
            {(sourceFilter === "all" || sourceFilter === "external") && (!hasSearch || groups.external.length) ? renderGroup("external") : null}
            {sourceFilter === "all" && (!hasSearch || groups.dify.length || groups.n8n.length) ? <div className="grid items-start gap-3 lg:grid-cols-2">
              {!hasSearch || groups.dify.length ? renderGroup("dify") : null}
              {!hasSearch || groups.n8n.length ? renderGroup("n8n") : null}
            </div> : null}
            {sourceFilter === "dify" && (!hasSearch || groups.dify.length) ? renderGroup("dify") : null}
            {sourceFilter === "n8n" && (!hasSearch || groups.n8n.length) ? renderGroup("n8n") : null}
          </div>
        ) : <EmptyApps />}
      </section>
      {editingApp !== undefined ? <ApplicationForm key={editingApp?.id ?? "new"} app={editingApp} source={newApplicationSource} onClose={() => setEditingApp(undefined)} onSaved={handleSaved} /> : null}
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
