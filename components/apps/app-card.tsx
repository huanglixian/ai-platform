import { ArrowUpRight, Trash2 } from "lucide-react";
import type { PublishedApp } from "@/features/apps/types";
import { typeLabels, sourceStyles } from "./app-presentation";

type AppCardProps = {
  app: PublishedApp;
  onSelect: (app: PublishedApp) => void;
  onOpen: (app: PublishedApp) => void;
  onRemove: (app: PublishedApp) => void;
};

export function AppCard({ app, onSelect, onOpen, onRemove }: AppCardProps) {
  const sourceStyle = sourceStyles[app.source];
  const launchIndicator = app.launchStatus === "starting"
    ? { label: "启动中", textClass: "text-sky-600", dotClass: "animate-pulse bg-sky-500" }
    : app.launchStatus === "running"
      ? { label: "运行中", textClass: "text-emerald-600", dotClass: "bg-emerald-500" }
      : null;

  return (
    <article className="group relative flex min-h-[176px] flex-col justify-between rounded-xl border border-border bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <button
        type="button"
        onClick={() => onSelect(app)}
        aria-label={`查看${app.name}`}
        className="absolute inset-0 z-0 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />
      <div className="pointer-events-none relative z-[1]">
        <div className="flex items-start justify-between gap-3 pr-[4.5rem]">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sourceStyle.badge}`}>{sourceStyle.label}</span>
          {launchIndicator ? <span className={`flex items-center gap-1 text-[10px] font-medium ${launchIndicator.textClass}`}><span className={`h-1.5 w-1.5 rounded-full ${launchIndicator.dotClass}`} />{launchIndicator.label}</span> : null}
        </div>
        <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-5 text-title transition-colors group-hover:text-primary">{app.name}</h3>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{app.description}</p>
      </div>
      <div className="pointer-events-none relative z-[1] mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400">
        <span className="font-semibold text-slate-500">{typeLabels[app.appType]}</span>
        <span>{app.source === "appfactory" ? "已发布" : "查看详情"}</span>
      </div>
      {app.source === "external" && app.launchStatus === "running" ? <button type="button" onClick={() => onOpen(app)} aria-label={`打开${app.name}`} title={`打开${app.name}`} className="absolute right-11 top-3 z-10 grid h-7 w-7 place-items-center rounded-md border border-primary/20 bg-primary/[0.06] text-primary shadow-sm transition-all hover:-translate-y-px hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowUpRight size={15} /></button> : null}
      <button type="button" onClick={() => onRemove(app)} aria-label={`删除${app.name}`} className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white/95 text-slate-400 shadow-sm transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"><Trash2 size={14} /></button>
    </article>
  );
}
