"use client";

import { Menu } from "@base-ui/react/menu";
import { ArrowUpRight, MoreHorizontal, Trash2 } from "lucide-react";
import type { PublishedApp } from "@/features/apps/types";
import { typeLabels } from "./application-presentation";

type AppCardProps = {
  app: PublishedApp;
  onSelect: (app: PublishedApp) => void;
  onOpen: (app: PublishedApp) => void;
  onRemove: (app: PublishedApp) => void;
};

export function AppCard({ app, onSelect, onOpen, onRemove }: AppCardProps) {
  const launchIndicator = app.launchStatus === "starting"
    ? { label: "启动中", style: "text-sky-700", dot: "animate-pulse bg-sky-500" }
    : app.launchStatus === "running"
      ? { label: "运行中", style: "text-emerald-700", dot: "bg-emerald-500" }
      : null;

  return (
    <article className="group relative flex min-h-[122px] min-w-0 flex-col rounded-lg border border-[#e5ebf1] bg-[#fcfdfe] p-3 transition-colors hover:border-[#b9cddd] hover:bg-[#f5f9fc]">
      <button type="button" onClick={() => onSelect(app)} aria-label={`${app.source === "appfactory" ? "打开" : "查看"}${app.name}`} className="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a86ab]" />
      <div className="pointer-events-none relative min-w-0">
        <h3 title={app.name} className="truncate text-[14px] font-semibold leading-5 text-[#294359] transition-colors group-hover:text-[#175d91]">{app.name}</h3>
        <p title={app.description} className="mt-1 line-clamp-2 text-[12px] leading-[18px] text-[#718395]">{app.description}</p>
      </div>
      <div className="pointer-events-none relative mt-auto flex min-h-7 items-center gap-2 pt-1.5">
        <span className="truncate text-[11px] text-[#8b9aaa]">{typeLabels[app.appType]}</span>
        {launchIndicator ? <span className={`flex shrink-0 items-center gap-1 text-[11px] ${launchIndicator.style}`}><span className={`h-1 w-1 rounded-full ${launchIndicator.dot}`} />{launchIndicator.label}</span> : null}
        <div className="pointer-events-auto ml-auto flex shrink-0 items-center gap-1">
          {app.source === "external" && app.launchStatus === "running" ? (
            <button type="button" onClick={() => onOpen(app)} aria-label={`打开${app.name}`} title="打开应用" className="grid h-6 w-6 place-items-center rounded text-[#5b819f] hover:bg-[#e6eff6] hover:text-[#175d91] focus-visible:outline-2 focus-visible:outline-[#5a86ab]"><ArrowUpRight size={14} /></button>
          ) : null}
          <Menu.Root>
            <Menu.Trigger aria-label={`${app.name}的更多操作`} className="grid h-6 w-6 place-items-center rounded text-[#8b9aaa] hover:bg-[#e6eff6] hover:text-[#365e7d] focus-visible:outline-2 focus-visible:outline-[#5a86ab]"><MoreHorizontal size={16} /></Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner side="bottom" align="end" sideOffset={4} className="z-50">
                <Menu.Popup className="min-w-32 rounded-lg border border-[#dce5ed] bg-white p-1 shadow-lg outline-none">
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
