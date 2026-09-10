import type { PublishedApp } from "@/features/apps/types";
import { typeLabels, sourceStyles } from "./app-presentation";

type AppCardProps = {
  app: PublishedApp;
  onSelect: (app: PublishedApp) => void;
};

export function AppCard({ app, onSelect }: AppCardProps) {
  const sourceStyle = sourceStyles[app.source];

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`查看${app.name}`}
      onClick={() => onSelect(app)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(app);
        }
      }}
      className="group relative flex min-h-[176px] cursor-pointer flex-col justify-between rounded-xl border border-border bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sourceStyle.badge}`}>{sourceStyle.label}</span>
          {app.source === "external" && app.isManagedRunning ? <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />运行中</span> : null}
        </div>
        <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-5 text-title transition-colors group-hover:text-primary">{app.name}</h3>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{app.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400">
        <span className="font-semibold text-slate-500">{typeLabels[app.appType]}</span>
        <span>{app.source === "appfactory" ? "已发布" : "查看详情"}</span>
      </div>
    </article>
  );
}
