"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Plus, Search, Square } from "lucide-react";
import type { ExternalStopResponse, PlatformSource, PublishedApp } from "@/features/apps/types";
import { notify } from "@/features/feedback/notify";
import { InlineNotice } from "@/components/shared/inline-notice";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useCurrentUser } from "@/features/auth/auth-provider";
import { hasPermission } from "@/features/auth/types";
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

const groupActionClassName = "inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-md border border-[var(--skin-border)] bg-white/75 px-2.5 text-[12px] font-medium text-[var(--skin-primary)] shadow-[0_1px_2px_rgba(var(--skin-shadow-rgb),0.04)] transition-[background-color,border-color,box-shadow] hover:border-[var(--skin-border-strong)] hover:bg-white hover:shadow-[0_2px_5px_rgba(var(--skin-shadow-rgb),0.08)] active:bg-[var(--skin-surface-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--skin-ring)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";

function EmptyApps() {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 text-center">
      <div className="text-sm font-semibold text-title">没有找到应用</div>
      <p className="mt-2 max-w-[280px] text-xs leading-5 text-muted-foreground">可以调整搜索条件，或联系管理员分配应用。</p>
    </div>
  );
}

type ApplicationGroupProps = {
  source: PlatformSource;
  apps: PublishedApp[];
  onAdd?: () => void;
  onStopAll?: () => void;
  canStopAll: boolean;
  stoppingAll: boolean;
  pendingService: { appId: string; action: "start" | "stop" } | null;
  onOpen: (app: PublishedApp) => void;
  onEdit: (app: PublishedApp) => void;
  onServiceAction: (app: PublishedApp, action: "start" | "stop") => void;
  onRemove: (app: PublishedApp) => void;
};

function ApplicationGroup({ source, apps, onAdd, onStopAll, canStopAll, stoppingAll, pendingService, onOpen, onEdit, onServiceAction, onRemove }: ApplicationGroupProps) {
  const compactGrid = source === "dify" || source === "n8n";
  const isStoppingGroup = source === "external" && stoppingAll;

  return (
    <section aria-labelledby={`application-group-${source}`} className="min-w-0 overflow-hidden rounded-xl border border-[var(--skin-border)] bg-[var(--skin-surface-soft)] shadow-[0_3px_12px_rgba(var(--skin-shadow-rgb),0.035)]">
      <header className="flex min-h-11 flex-wrap items-center gap-x-2.5 gap-y-2 border-b border-[var(--skin-border)] bg-[image:var(--skin-section-background)] px-3.5 py-2">
        <span aria-hidden="true" className="h-3.5 w-[3px] shrink-0 rounded-full bg-[var(--skin-primary)]" />
        <h2 id={`application-group-${source}`} className="text-[14px] font-semibold tracking-[0.01em] text-[var(--skin-primary)]">{sourceLabels[source]}</h2>
        {onAdd ? (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {onStopAll ? (
              <button type="button" onClick={onStopAll} disabled={!canStopAll || stoppingAll} aria-busy={stoppingAll} title="停止所有由平台启动的外部应用（包含搜索结果之外的应用）" className={groupActionClassName}>
                {stoppingAll ? <LoaderCircle size={13} className="animate-spin" /> : <Square size={13} strokeWidth={1.8} />}
                {stoppingAll ? "停止中…" : "全部停止"}
              </button>
            ) : null}
            <button type="button" onClick={onAdd} disabled={isStoppingGroup} className={groupActionClassName}><Plus size={14} strokeWidth={1.8} />接入应用</button>
          </div>
        ) : null}
      </header>
      {apps.length ? (
        <div className={compactGrid ? "grid gap-2 p-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" : "grid gap-2 p-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
          {apps.map((app) => <AppCard key={app.id} app={app} pendingAction={isStoppingGroup && app.launchStatus !== null ? "stop" : pendingService?.appId === app.id ? pendingService.action : null} serviceDisabled={stoppingAll || pendingService !== null} menuDisabled={isStoppingGroup} onOpen={onOpen} onEdit={onEdit} onServiceAction={onServiceAction} onRemove={onRemove} />)}
        </div>
      ) : <div className="px-4 py-5 text-center text-[12px] text-[var(--skin-text-muted)]">暂无应用</div>}
    </section>
  );
}

export function ApplicationCatalog() {
  const canManage = hasPermission(useCurrentUser(), "applications.manage");
  const [list, setList] = useState<PublishedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingApp, setEditingApp] = useState<PublishedApp | null | undefined>(undefined);
  const [newApplicationSource, setNewApplicationSource] = useState<"external" | "dify" | "n8n">("external");
  const [sourceFilter, setSourceFilter] = useState<ApplicationFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [pendingService, setPendingService] = useState<{ appId: string; action: "start" | "stop" } | null>(null);
  const [stoppingAll, setStoppingAll] = useState(false);
  const [removingApp, setRemovingApp] = useState<PublishedApp | null>(null);
  const [removing, setRemoving] = useState(false);

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
    if (stoppingAll || pendingService) return;
    setPendingService({ appId: app.id, action });
    if (action === "start") replaceApplication({ ...app, launchStatus: "starting" });
    try {
      const response = await fetch(`/api/agenthub/v1/applications/${app.id}/${action}`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "服务操作失败");
      replaceApplication(payload.data);
      notify.success(`已${action === "start" ? "启动" : "停止"}“${app.name}”`);
    } catch (error) {
      if (action === "start") replaceApplication({ ...app, launchStatus: null });
      notify.error(error instanceof Error ? error.message : "服务操作失败");
    } finally {
      setPendingService(null);
    }
  }

  async function handleStopAll() {
    if (stoppingAll || pendingService || removing) return;
    setStoppingAll(true);
    try {
      const response = await fetch("/api/agenthub/v1/applications/stop", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "批量停止服务失败");
      const result: ExternalStopResponse = payload.data;
      setList(result.applications);
      if (result.failures.length) {
        notify.warning(`已停止 ${result.stoppedIds.length} 个应用，${result.failures.length} 个停止失败`, { details: result.failures.map((failure) => `${failure.name}：${failure.message}`).join("\n") });
      } else {
        notify.success(result.stoppedIds.length ? `已停止 ${result.stoppedIds.length} 个外部应用` : "当前没有需要停止的外部应用");
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "批量停止服务失败");
    } finally {
      setStoppingAll(false);
    }
  }

  async function confirmRemove() {
    if (!removingApp) return;
    setRemoving(true);
    try {
      const response = await fetch(`/api/agenthub/v1/applications/${removingApp.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "移除应用失败");
      setList((current) => current.filter((item) => item.id !== removingApp.id));
      setRemovingApp(null);
      notify.success(`已删除“${removingApp.name}”`);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "移除应用失败");
    } finally {
      setRemoving(false);
    }
  }

  function handleOpen(app: PublishedApp) {
    window.open(`/applications/${encodeURIComponent(app.id)}/open`, "_blank", "noopener,noreferrer");
  }

  function requestRemove(app: PublishedApp) {
    setRemovingApp(app);
  }

  function openApplicationForm(source: "external" | "dify" | "n8n") {
    setNewApplicationSource(source);
    setEditingApp(null);
  }

  function handleSaved(app: PublishedApp, isNew: boolean) {
    setList((current) => app.canUse === false ? current.filter((item) => item.id !== app.id) : isNew ? [app, ...current] : current.map((item) => item.id === app.id ? app : item));
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
        onAdd={!canManage || source === "appfactory" ? undefined : () => openApplicationForm(source)}
        onStopAll={canManage && source === "external" ? () => void handleStopAll() : undefined}
        canStopAll={!pendingService && !removing && list.some((app) => app.source === "external" && app.launchStatus !== null)}
        stoppingAll={stoppingAll}
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
        {loadError ? <InlineNotice className="mb-3" action={<button type="button" onClick={() => window.location.reload()}>重新加载</button>}>{loadError}</InlineNotice> : null}
        <div className="mb-3 flex min-w-0 items-center gap-3 overflow-x-auto pb-px">
          <div role="group" aria-label="应用来源筛选" className="inline-flex h-[34px] shrink-0 items-center rounded-lg border border-[var(--skin-border)] bg-[var(--skin-surface-accent)] p-[3px] shadow-[inset_0_1px_2px_rgba(var(--skin-shadow-rgb),0.04)]">
            {sourceFilters.map((filter) => <button key={filter.value} type="button" aria-pressed={sourceFilter === filter.value} onClick={() => setSourceFilter(filter.value)} className={`h-[26px] rounded-md px-3 text-[11px] font-medium transition-[color,background-color,box-shadow] ${sourceFilter === filter.value ? "bg-white text-[var(--skin-primary)] shadow-[0_1px_4px_rgba(var(--skin-shadow-rgb),0.08)]" : "text-[var(--skin-text-muted)] hover:text-[var(--skin-primary)]"}`}>{filter.label}</button>)}
          </div>
          <label className="flex h-[34px] min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[var(--skin-border)] bg-white px-3 transition-colors focus-within:border-[var(--skin-border-strong)] focus-within:ring-2 focus-within:ring-[var(--skin-surface-accent)]">
            <Search size={16} className="shrink-0 text-[var(--skin-text-muted)]" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索应用"
              aria-label="搜索应用"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-title outline-none placeholder:text-[var(--skin-text-subtle)]"
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
      <ConfirmDialog
        open={removingApp !== null}
        onOpenChange={(open) => { if (!open) setRemovingApp(null); }}
        title="删除应用"
        description={`确定删除“${removingApp?.name}”吗？${removingApp?.source === "appfactory" ? "已发布的运行时会停止，但 AppFactory 项目和发布历史会保留。" : removingApp?.source === "external" ? "由应用中心启动的服务会一并停止。" : "该应用注册记录会从应用中心删除。"}`}
        pending={removing}
        onConfirm={() => void confirmRemove()}
      />
    </>
  );
}
