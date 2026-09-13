"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ExternalLink, LoaderCircle, Pencil, Play, Square, Trash2, X } from "lucide-react";
import type { PublishedApp } from "@/features/apps/types";
import { sourceStyles, typeLabels } from "./application-presentation";

type AppActionDrawerProps = {
  app: PublishedApp;
  pendingAction: "start" | "stop" | null;
  error: string;
  onClose: () => void;
  onOpen: (app: PublishedApp) => void;
  onStart: (app: PublishedApp) => void;
  onStop: (app: PublishedApp) => void;
  onEdit: (app: PublishedApp) => void;
  onRemove: (app: PublishedApp) => void;
};

export function AppActionDrawer({ app, pendingAction, error, onClose, onOpen, onStart, onStop, onEdit, onRemove }: AppActionDrawerProps) {
  const isExternal = app.source === "external";
  const isPending = pendingAction !== null;
  const isManaged = app.launchStatus !== null;
  const sourceStyle = sourceStyles[app.source];
  const serviceStatus = app.launchStatus === "starting"
    ? { label: "正在启动", className: "font-medium text-sky-600" }
    : app.launchStatus === "running"
      ? { label: "由应用中心运行中", className: "font-medium text-emerald-600" }
      : { label: "未由应用中心启动", className: "text-slate-700" };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[1px]" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-white shadow-2xl focus:outline-none sm:w-[440px]">
          <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
            <div className="min-w-0">
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sourceStyle.badge}`}>{sourceStyle.label}</span>
              <Dialog.Title className="mt-2 truncate text-base font-bold text-title">{app.name}</Dialog.Title>
              <Dialog.Description className="sr-only">应用详情与操作</Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label="关闭详情"><X size={18} /></Dialog.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <p className="text-sm leading-6 text-slate-600">{app.description}</p>
            <dl className="mt-6 space-y-3 border-y border-slate-100 py-4 text-xs">
              <div className="flex gap-3"><dt className="w-16 shrink-0 text-slate-400">应用类型</dt><dd className="text-slate-700">{typeLabels[app.appType]}</dd></div>
              <div className="flex gap-3"><dt className="w-16 shrink-0 text-slate-400">访问地址</dt><dd className="min-w-0 break-all text-slate-700">{app.url}</dd></div>
              {isExternal ? <div className="flex gap-3"><dt className="w-16 shrink-0 text-slate-400">服务状态</dt><dd className={serviceStatus.className}>{serviceStatus.label}</dd></div> : null}
            </dl>
            {isExternal ? <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">应用中心只会停止由自己启动的服务；关闭此窗口不会停止服务。</p> : null}
            {error ? <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">{error}</p> : null}
          </div>
          <footer className="border-t border-border px-5 py-4">
            <button type="button" onClick={() => onOpen(app)} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white transition-colors hover:bg-primary/90"><ExternalLink size={16} />打开应用</button>
            {isExternal ? <div className="mt-2 grid grid-cols-2 gap-2">
              {isManaged ? <button type="button" onClick={() => onStop(app)} disabled={isPending} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60">{pendingAction === "stop" ? <LoaderCircle size={15} className="animate-spin" /> : <Square size={15} />}停止服务</button> : <button type="button" onClick={() => onStart(app)} disabled={isPending} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary/25 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60">{pendingAction === "start" ? <LoaderCircle size={15} className="animate-spin" /> : <Play size={15} />}启动服务</button>}
              <button type="button" onClick={() => onEdit(app)} disabled={isPending} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"><Pencil size={15} />编辑</button>
              <button type="button" onClick={() => onRemove(app)} disabled={isPending} className="col-span-2 inline-flex h-9 items-center justify-center gap-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"><Trash2 size={14} />删除应用</button>
            </div> : null}
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
