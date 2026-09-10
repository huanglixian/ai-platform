"use client";

import { useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import type { PublishedApp } from "@/features/apps/types";

type ExternalAppFormProps = {
  app: PublishedApp | null;
  onClose: () => void;
  onSaved: (app: PublishedApp, isNew: boolean) => void;
};

export function ExternalAppForm({ app, onClose, onSaved }: ExternalAppFormProps) {
  const [name, setName] = useState(app?.name ?? "");
  const [description, setDescription] = useState(app?.description ?? "");
  const [url, setUrl] = useState(app?.url ?? "");
  const [launchCommand, setLaunchCommand] = useState(app?.launchCommand ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(app);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch(isEditing ? `/api/agenthub/v1/applications/${app?.id}` : "/api/agenthub/v1/applications", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(isEditing ? { name, description, entryUrl: url, launchCommand } : { name, description, producer: "external", kind: "business", entryUrl: url, launchCommand }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "保存失败");
      onSaved(payload.data, !isEditing);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="external-app-form-title" className="max-h-[calc(100vh-32px)] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><h2 id="external-app-form-title" className="text-base font-bold text-title">{isEditing ? "编辑外部应用" : "接入外部应用"}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">保存名称、说明、启动命令和访问地址；应用代码无需改动。</p></div><button type="button" onClick={onClose} aria-label="关闭" className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button></div>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">应用名称</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：项目管理系统" className="h-10 w-full rounded-lg border border-input px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">应用说明</span><textarea required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="用一句话说明这个应用能做什么" className="min-h-20 w-full resize-y rounded-lg border border-input px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">访问地址</span><input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="http://127.0.0.1:端口号" className="h-10 w-full rounded-lg border border-input px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">启动命令</span><textarea required value={launchCommand} onChange={(event) => setLaunchCommand(event.target.value)} placeholder="在这里粘贴本机的启动命令" className="min-h-24 w-full resize-y rounded-lg border border-input px-3 py-2 font-mono text-xs leading-5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">取消</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">{saving ? <LoaderCircle size={15} className="animate-spin" /> : null}{isEditing ? "保存修改" : "接入应用"}</button></div>
        </form>
      </section>
    </div>
  );
}
