"use client";

import { notify } from "@/features/feedback/notify";
import { useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import type { PlatformSource, PublishedApp } from "@/features/apps/types";
import { VisibilitySelector } from "@/features/access/visibility-selector";
import type { Visibility } from "@/features/access/types";
import { sourceLabels } from "./application-presentation";
import { ApplicationDeployment } from "./application-deployment";
import { InlineNotice } from "@/components/shared/inline-notice";

type ApplicationFormProps = {
  app: PublishedApp | null;
  source: "external" | "dify" | "n8n";
  onClose: () => void;
  onSaved: (app: PublishedApp, isNew: boolean) => void;
  onUpdated: (app: PublishedApp) => void;
};

export function ApplicationForm({ app, source, onClose, onSaved, onUpdated }: ApplicationFormProps) {
  const [name, setName] = useState(app?.name ?? "");
  const [description, setDescription] = useState(app?.description ?? "");
  const [url, setUrl] = useState(app?.url ?? "");
  const [launchCommand, setLaunchCommand] = useState(app?.launchCommand ?? "");
  const [visibility, setVisibility] = useState<Visibility>(app?.access?.visibility ?? "internal");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"link" | "managed" | "source">(app?.deployment ? "source" : app?.launchMode ?? "link");
  const [archive, setArchive] = useState<File | null>(null);
  const [instructions, setInstructions] = useState("");
  const [environment, setEnvironment] = useState("");
  const [error, setError] = useState("");
  const isEditing = Boolean(app);
  const applicationSource: PlatformSource = app?.source ?? source;
  const isExternal = applicationSource === "external";
  const isSourceImport = isExternal && mode === "source";
  const requiresLaunchCommand = isExternal && mode === "managed";
  const hasEditableUrl = applicationSource !== "appfactory" && !isSourceImport;
  const sourceLabel = sourceLabels[applicationSource];
  const title = isEditing ? `编辑${sourceLabel}` : `接入${sourceLabel}`;
  const descriptionText = applicationSource === "appfactory"
    ? "修改首页卡片的名称和说明；运行地址由发布流程维护。"
    : isSourceImport
      ? "上传可信源码，AI 准备依赖和启动配置；验证通过后可随时启动。"
    : requiresLaunchCommand
      ? "保存名称、说明、启动命令和访问地址；应用代码无需改动。"
      : "保存名称、说明和访问地址，即可纳入应用目录。";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (requiresLaunchCommand && !launchCommand.trim()) throw new Error("请输入启动命令");
      if (isSourceImport && !isEditing) {
        if (!archive || archive.size > 100 * 1024 * 1024) throw new Error("请选择不超过 100 MB 的 ZIP 源码包");
        const form = new FormData();
        for (const [key, value] of Object.entries({ name, description, visibility, instructions, environment })) form.set(key, value);
        form.set("archive", archive);
        const response = await fetch("/api/agenthub/v1/applications/import", { method: "POST", body: form });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "源码导入失败");
        onSaved(payload.data, true);
        notify.success("源码已接入，AI 正在后台准备环境");
        return;
      }
      const response = await fetch(isEditing ? `/api/agenthub/v1/applications/${app?.id}` : "/api/agenthub/v1/applications", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(isEditing ? {
          name,
          description,
          visibility,
          policyRevision: app?.access?.revision,
          ...(hasEditableUrl ? { entryUrl: url } : {}),
          ...(isExternal && !isSourceImport ? { launchCommand: requiresLaunchCommand ? launchCommand : null } : {}),
        } : {
          name,
          description,
          visibility,
          producer: applicationSource,
          kind: "business",
          entryUrl: url,
          ...(requiresLaunchCommand ? { launchCommand } : {}),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "保存失败");
      onSaved(payload.data, !isEditing);
      notify.success(isEditing ? "应用信息已保存" : "应用已接入");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="application-form-title" className="max-h-[calc(100vh-32px)] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><h2 id="application-form-title" className="text-base font-bold text-title">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{descriptionText}</p></div><button type="button" onClick={onClose} aria-label="关闭" className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button></div>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {isExternal && !app?.deployment ? <fieldset disabled={saving} className="space-y-2"><legend className="mb-2 text-xs font-semibold text-slate-600">接入方式</legend><div className="grid grid-cols-3 gap-2">{([
            ["link", "URL 直达"], ["managed", "已有环境，按需启动"], ...(!isEditing ? [["source", "上传源码，AI 部署"]] : []),
          ] as [typeof mode, string][]).map(([value, label]) => <label key={value} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-xs leading-5 ${mode === value ? "border-primary bg-primary/5 text-primary" : "border-input text-slate-600"}`}><input type="radio" name="application-mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="mt-1 accent-[var(--skin-primary)]" />{label}</label>)}</div></fieldset> : null}
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">应用名称</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：项目管理系统" className="h-10 w-full rounded-lg border border-input px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">应用说明</span><textarea required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="用一句话说明这个应用能做什么" className="min-h-20 w-full resize-y rounded-lg border border-input px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
          {hasEditableUrl ? <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">访问地址</span><input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="http://127.0.0.1:端口号" className="h-10 w-full rounded-lg border border-input px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" /></label> : null}
          {requiresLaunchCommand ? <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">启动命令</span><textarea required value={launchCommand} onChange={(event) => setLaunchCommand(event.target.value)} placeholder="在这里粘贴本机的启动命令" className="min-h-24 w-full resize-y rounded-lg border border-input px-3 py-2 font-mono text-xs leading-5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" /></label> : null}
          {isSourceImport && !isEditing ? <>
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">源码压缩包</span><input required type="file" accept=".zip" onChange={(event) => setArchive(event.target.files?.[0] ?? null)} className="block w-full rounded-lg border border-input p-2 text-xs" /><span className="block text-[11px] text-muted-foreground">支持 100 MB 以内的 ZIP，适用于可信的 Node.js / Python Web 应用。每个应用独立管理源码和依赖。</span></label>
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">部署说明（可选）</span><textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="例如主程序入口、需要使用的 Python 版本" className="min-h-16 w-full rounded-lg border border-input p-3 text-sm" /></label>
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">环境变量（可选）</span><textarea value={environment} onChange={(event) => setEnvironment(event.target.value)} placeholder="KEY=value，每行一项；也可以在 AI 分析后补充" className="min-h-20 w-full rounded-lg border border-input p-3 font-mono text-xs" /></label>
          </> : null}
          {app?.deployment ? <ApplicationDeployment app={app} onUpdated={onUpdated} /> : null}
          <VisibilitySelector value={visibility} onChange={setVisibility} disabled={saving} />
          {error ? <InlineNotice>{error}</InlineNotice> : null}
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">取消</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">{saving ? <LoaderCircle size={15} className="animate-spin" /> : null}{isEditing ? "保存修改" : "接入应用"}</button></div>
        </form>
      </section>
    </div>
  );
}
