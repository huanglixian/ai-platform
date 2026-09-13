"use client";

import { Menu } from "@base-ui/react/menu";
import { ArrowUpRight, LoaderCircle, MoreHorizontal, Pencil, Play, Square, Trash2 } from "lucide-react";
import type { PublishedApp } from "@/features/apps/types";
import { sourceAccents, typeLabels } from "./application-presentation";

type AppCardProps = {
  app: PublishedApp;
  pendingAction: "start" | "stop" | null;
  onOpen: (app: PublishedApp) => void;
  onEdit: (app: PublishedApp) => void;
  onServiceAction: (app: PublishedApp, action: "start" | "stop") => void;
  onRemove: (app: PublishedApp) => void;
};

export function AppCard({ app, pendingAction, onOpen, onEdit, onServiceAction, onRemove }: AppCardProps) {
  const accent = sourceAccents[app.source];
  const Icon = accent.icon;
  const isExternal = app.source === "external";
  const isRunning = app.launchStatus === "running";
  const isManaged = app.launchStatus !== null;
  const canOpen = !isExternal || isRunning;
  const launchIndicator = app.launchStatus === "starting" && pendingAction !== "start"
    ? { label: "启动中", style: "text-sky-700", dot: "animate-pulse bg-sky-500" }
    : app.launchStatus === "running"
      ? { label: "运行中", style: "text-emerald-700", dot: "bg-emerald-500" }
      : null;

  return (
    <article className="group relative flex min-h-[122px] min-w-0 flex-col rounded-lg border border-[#dce3ea] bg-white p-3 transition-[border-color,box-shadow] duration-150 hover:border-[#a6bbcd] hover:shadow-[0_3px_10px_rgba(24,49,78,0.07)]">
      {canOpen ? <button type="button" onClick={() => onOpen(app)} aria-label={`打开${app.name}`} className="absolute inset-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a86ab]" /> : null}
      <div className="pointer-events-none relative grid min-w-0 grid-cols-[28px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
        <span aria-hidden="true" className={`grid h-7 w-7 place-items-center rounded-lg border ${accent.iconClass}`}><Icon size={15} strokeWidth={1.7} /></span>
        <h3 title={app.name} className="truncate text-[14px] font-semibold leading-5 text-[#263b50] transition-colors group-hover:text-[#175d91]">{app.name}</h3>
        <p title={app.description} className="col-span-2 line-clamp-2 text-[12px] leading-[18px] text-[#687789]">{app.description}</p>
      </div>
      <div className="pointer-events-none relative mt-auto flex min-h-7 items-center gap-2 pt-1.5">
        <span className="truncate text-[11px] text-[#8b9aaa]">{typeLabels[app.appType]}</span>
        {launchIndicator ? <span className={`flex shrink-0 items-center gap-1 text-[11px] ${launchIndicator.style}`}><span className={`h-1 w-1 rounded-full ${launchIndicator.dot}`} />{launchIndicator.label}</span> : null}
        <div className="pointer-events-auto ml-auto flex shrink-0 items-center gap-1">
          {canOpen ? (
            <button type="button" onClick={() => onOpen(app)} aria-label={`打开${app.name}`} title="打开应用" className="grid h-6 w-6 place-items-center rounded text-[#5b819f] hover:bg-[#e6eff6] hover:text-[#175d91] focus-visible:outline-2 focus-visible:outline-[#5a86ab]"><ArrowUpRight size={14} /></button>
          ) : null}
          {isExternal ? isManaged ? (
            <button type="button" disabled={pendingAction !== null} onClick={() => onServiceAction(app, "stop")} className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] font-medium text-[#a25a56] hover:bg-[#f9eceb] hover:text-[#913f3b] focus-visible:outline-2 focus-visible:outline-[#b77975] disabled:cursor-not-allowed disabled:opacity-60">
              {pendingAction ? <LoaderCircle size={12} className="animate-spin" /> : <Square size={11} fill="currentColor" />}{pendingAction === "start" ? "启动中" : pendingAction === "stop" ? "停止中" : "停止"}
            </button>
          ) : (
            <button type="button" disabled={pendingAction !== null} onClick={() => onServiceAction(app, "start")} className="inline-flex h-6 items-center gap-1 rounded bg-[#e9f3fa] px-2 text-[11px] font-medium text-[#286b98] hover:bg-[#dcecf7] hover:text-[#155b91] focus-visible:outline-2 focus-visible:outline-[#5a86ab] disabled:cursor-not-allowed disabled:opacity-60">
              <Play size={11} fill="currentColor" />启动
            </button>
          ) : null}
          <Menu.Root>
            <Menu.Trigger aria-label={`${app.name}的更多操作`} className="grid h-6 w-6 place-items-center rounded text-[#8b9aaa] hover:bg-[#e6eff6] hover:text-[#365e7d] focus-visible:outline-2 focus-visible:outline-[#5a86ab]"><MoreHorizontal size={16} /></Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner side="bottom" align="end" sideOffset={4} className="z-50">
                <Menu.Popup className="min-w-32 rounded-lg border border-[#dce5ed] bg-white p-1 shadow-lg outline-none">
                  <Menu.Item onClick={() => onEdit(app)} className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs text-[#526e85] outline-none data-[highlighted]:bg-[#edf4f9] data-[highlighted]:text-[#175d91]"><Pencil size={13} />编辑应用</Menu.Item>
                  <Menu.Item onClick={() => onRemove(app)} className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs text-rose-600 outline-none data-[highlighted]:bg-rose-50"><Trash2 size={13} />删除应用</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>
    </article>
  );
}
