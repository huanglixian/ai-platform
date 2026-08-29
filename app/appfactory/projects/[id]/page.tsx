"use client";

import { useEffect, useRef, useState } from "react";

type Event = { type: string; content: string };
type Session = { id: string };
type ProjectStatus = { preview?: { url?: string; status?: string }; build?: { status?: string }; release?: unknown; deployment?: { url?: string; status?: string } };

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [prompt, setPrompt] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<ProjectStatus>({});
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    params.then(({ id: projectId }) => {
      setId(projectId);
      Promise.all([
        fetch(`/api/appfactory/v1/projects/${projectId}/sessions`).then((response) => response.json()),
        fetch(`/api/appfactory/v1/projects/${projectId}/status`).then((response) => response.json()),
      ])
        .then(async ([sessionsPayload, statusPayload]) => {
          if (sessionsPayload.error || statusPayload.error) throw new Error(sessionsPayload.error?.message || statusPayload.error?.message || "项目加载失败");
          const current = sessionsPayload.data?.[0] ?? (await fetch(`/api/appfactory/v1/projects/${projectId}/sessions`, { method: "POST" }).then((response) => response.json())).data;
          setSession(current);
          setStatus(statusPayload.data ?? {});
        })
        .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "项目加载失败"))
        .finally(() => setLoading(false));
    });
  }, [params]);

  const refreshStatus = () => fetch(`/api/appfactory/v1/projects/${id}/status`).then((response) => response.json()).then((payload) => setStatus(payload.data ?? {}));
  const action = (name: string) => {
    setBusy(true);
    setError("");
    const controller = new AbortController();
    controllerRef.current = controller;
    fetch(`/api/appfactory/v1/projects/${id}/${name}`, { method: "POST", signal: controller.signal })
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message || `${name} 失败`); return payload; })
      .then((payload) => setEvents((current) => [...current, { type: name, content: JSON.stringify(payload.data ?? payload.error) }]))
      .catch((reason: unknown) => { if ((reason as { name?: string })?.name !== "AbortError") setError(reason instanceof Error ? reason.message : `${name} 失败`); })
      .finally(() => { setBusy(false); controllerRef.current = null; void refreshStatus(); });
  };
  const send = () => {
    if (!session || !prompt.trim() || busy) return;
    setBusy(true);
    setError("");
    const controller = new AbortController();
    controllerRef.current = controller;
    fetch(`/api/appfactory/v1/sessions/${session.id}/run`, { method: "POST", signal: controller.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) })
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message || "Pi 执行失败"); return payload; })
      .then((payload) => { setEvents((current) => [...current, ...(payload.data?.events ?? [])]); setPrompt(""); })
      .catch((reason: unknown) => { if ((reason as { name?: string })?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Pi 执行失败"); })
      .finally(() => { setBusy(false); controllerRef.current = null; void refreshStatus(); });
  };
  const stop = () => { controllerRef.current?.abort(); controllerRef.current = null; if (session) void fetch(`/api/appfactory/v1/sessions/${session.id}/run`, { method: "DELETE" }); setBusy(false); setError("已停止当前任务"); };

  if (loading) return <main className="grid min-h-[calc(100vh-56px)] place-items-center p-6 text-sm text-slate-400">加载项目中…</main>;
  if (error && !id) return <main className="grid min-h-[calc(100vh-56px)] place-items-center p-6 text-sm text-rose-600">{error}</main>;

  return <main className="grid min-h-[calc(100vh-56px)] grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_280px_320px] lg:items-stretch">
    <section className="flex min-h-[540px] min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="border-b border-slate-100 pb-4"><p className="text-xs font-semibold text-indigo-600">DEVELOPMENT WORKSPACE</p><h1 className="mt-1 text-lg font-semibold">AI Coding 对话</h1></div>
      {error && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}
      <div className="min-h-0 flex-1 space-y-3 overflow-auto py-4">{events.length === 0 ? <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">描述你希望创建或修改的应用，Pi 会在当前 Workspace 内执行。</div> : events.map((event, index) => <div key={`${event.type}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><span className="mr-2 text-[10px] font-semibold uppercase text-indigo-500">{event.type}</span>{event.content}</div>)}</div>
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="例如：创建一个设备巡检看板" className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" /><button onClick={send} disabled={busy || !session} className="self-end rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? "执行中…" : "发送"}</button></div>
    </section>
    <aside className="contents"><div className="rounded-2xl border border-slate-200 bg-white p-4"><h2 className="text-sm font-semibold">文件与 Diff</h2><p className="mt-3 text-xs text-slate-400">Workspace 文件与最近改动将在这里显示</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">运行日志</h2><button disabled={!busy} onClick={stop} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 disabled:opacity-40">停止</button></div><div className="mt-3 max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-[10px] leading-5 text-slate-300">{events.length === 0 ? "暂无任务日志" : events.slice(-8).map((event, index) => <div key={`${event.type}-log-${index}`}><span className="text-indigo-300">[{event.type}]</span> {event.content}</div>)}</div><h2 className="mt-5 text-sm font-semibold">Preview / Build</h2><div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} onClick={() => action("check")} className="rounded-lg border px-2 py-1 text-xs disabled:opacity-50">Check</button><button disabled={busy} onClick={() => action("build")} className="rounded-lg border px-2 py-1 text-xs disabled:opacity-50">Build</button><button disabled={busy} onClick={() => action("preview")} className="rounded-lg bg-indigo-600 px-2 py-1 text-xs text-white disabled:opacity-50">Preview</button><button disabled={busy} onClick={() => action("deploy")} className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white disabled:opacity-50">Deploy</button></div><p className="mt-3 text-[11px] text-slate-500">Build：{status.build?.status ?? "未执行"} · Release：{status.release ? "已生成" : "未生成"} · Preview：{status.preview?.status ?? "未运行"} · Deployment：{status.deployment?.status ?? "未运行"}</p>{status.preview?.url && <a href={status.preview.url} target="_blank" rel="noreferrer" className="mr-3 mt-2 inline-block text-xs text-indigo-600 hover:underline">打开 Preview ↗</a>}{status.deployment?.url && <a href={status.deployment.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-indigo-600 hover:underline">打开本地应用 ↗</a>}</div></aside>
  </main>;
}
