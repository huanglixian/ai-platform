"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Project = {
  id: string;
  name: string;
  description: string;
  agentHubMode: string;
  updatedAt: string;
};

export default function AppFactoryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/appfactory/v1/projects")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "项目加载失败");
        return payload;
      })
      .then((payload) => setProjects(payload.data ?? []))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "项目加载失败"))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const create = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/appfactory/v1/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description, agentHubMode: "disabled" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "项目创建失败");
      setProjects((current) => [payload.data, ...current]);
      setName("");
      setDescription("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "项目创建失败");
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">AI application studio</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">应用开发</h1>
        <p className="mt-2 text-sm text-slate-500">从需求到预览，管理你的 AI Coding 项目。</p>
      </div>
      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">新建项目</h2>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="项目名称" className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="项目描述（可选）" className="mt-3 min-h-24 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
          <button onClick={create} disabled={creating || !name.trim()} className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{creating ? "创建中…" : "创建项目"}</button>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">最近项目</h2><span className="text-xs text-slate-400">{projects.length} 个项目</span></div>
          {loading ? <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">加载中…</div> : projects.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">还没有项目，创建第一个应用吧。</div> : <div className="grid gap-3 sm:grid-cols-2">{projects.map((project) => <Link key={project.id} href={`/appfactory/projects/${project.id}`} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"><div className="flex items-center justify-between gap-2"><h3 className="truncate text-sm font-semibold">{project.name}</h3><span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-600">独立模式</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{project.description || "暂无描述"}</p><p className="mt-4 text-[10px] text-slate-400">更新于 {new Date(project.updatedAt).toLocaleDateString("zh-CN")}</p></Link>)}</div>}
        </div>
      </section>
    </main>
  );
}
