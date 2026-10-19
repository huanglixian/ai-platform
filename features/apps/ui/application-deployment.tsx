"use client";

import { useEffect, useState } from "react";
import { InlineNotice } from "@/components/shared/inline-notice";
import { notify } from "@/features/feedback/notify";
import type { DeploymentSummary, PublishedApp } from "../types";
import { deploymentStatusLabels } from "./application-presentation";

type DeploymentDetail = DeploymentSummary & { directory: string; log: string };

export function ApplicationDeployment({ app, onUpdated }: { app: PublishedApp; onUpdated: (app: PublishedApp) => void }) {
  const [detail, setDetail] = useState<DeploymentDetail | null>(null);
  const [environment, setEnvironment] = useState("");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/agenthub/v1/applications/${app.id}/deployment`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "读取部署信息失败");
        setDetail(payload.data);
        setError("");
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "读取部署信息失败");
      }
    }
    void load();
    const timer = setInterval(() => void load(), 2_000);
    return () => { clearInterval(timer); controller.abort(); };
  }, [app.id, revision]);

  async function action(action: "retry" | "cancel") {
    setPending(true);
    try {
      const response = await fetch(`/api/agenthub/v1/applications/${app.id}/deployment`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...(action === "retry" ? { environment, ...(instructions.trim() ? { instructions } : {}) } : {}) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "部署操作失败");
      onUpdated(payload.data);
      setEnvironment("");
      setRevision((value) => value + 1);
      notify.success(action === "retry" ? "已提交部署任务" : "正在取消部署任务");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "部署操作失败");
    } finally { setPending(false); }
  }

  const active = detail?.status === "queued" || detail?.status === "running";
  return (
    <div className="space-y-3 rounded-lg border border-border bg-slate-50/70 p-3">
      <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-title">AI 部署 · {detail ? deploymentStatusLabels[detail.status] : "加载中"}</span>{active ? <button type="button" disabled={pending} onClick={() => void action("cancel")} className="text-xs text-rose-600 disabled:opacity-50">取消部署</button> : null}</div>
      {error ? <InlineNotice>{error}</InlineNotice> : null}
      {detail ? <>
        <p className="text-xs leading-5 text-muted-foreground">{detail.message}</p>
        {detail.error ? <InlineNotice>{detail.error}</InlineNotice> : null}
        {detail.missingConfig.length ? <InlineNotice variant="warning"><ul className="list-inside list-disc">{detail.missingConfig.map((item) => <li key={item}>{item}</li>)}</ul></InlineNotice> : null}
        <p className="break-all text-[11px] leading-5 text-muted-foreground">应用目录：{detail.directory}</p>
        {!active && detail.status !== "ready" ? <div className="space-y-2">
          <label className="block space-y-1"><span className="text-xs text-slate-600">补充环境变量</span><textarea aria-label="补充环境变量" value={environment} onChange={(event) => setEnvironment(event.target.value)} placeholder="KEY=value，每行一项；留空保留已有配置" className="min-h-20 w-full rounded-md border border-input bg-white p-2 font-mono text-xs" /></label>
          <label className="block space-y-1"><span className="text-xs text-slate-600">补充说明</span><textarea aria-label="部署补充说明" value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="例如数据库已经准备好，或需要使用的启动入口" className="min-h-16 w-full rounded-md border border-input bg-white p-2 text-xs" /></label>
          <button type="button" disabled={pending} onClick={() => void action("retry")} className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50">{pending ? "提交中…" : "继续部署"}</button>
        </div> : null}
        <details><summary className="cursor-pointer text-xs text-slate-600">查看安装与运行日志</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-md bg-slate-900 p-3 text-[11px] leading-5 text-slate-100">{detail.log || "暂无日志"}</pre></details>
      </> : null}
    </div>
  );
}
