"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePublicationTaskCenter } from "@/app/appfactory/_components/publication-task-center";

type Project = {
  id: string;
  name: string;
  description: string;
  skillProfile?: string;
  updatedAt: string;
};
type Filter = "全部" | "草稿" | "发布中" | "已发布" | "失败";
const filters: Filter[] = ["全部", "草稿", "发布中", "已发布", "失败"];

export default function AppFactoryPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("全部");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [skillProfile, setSkillProfile] = useState("nextjs-build");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const { latestForProject } = usePublicationTaskCenter();
  useEffect(() => {
    fetch("/api/appfactory/v1/projects")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error?.message || "项目加载失败");
        setProjects(payload.data ?? []);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "项目加载失败"),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  const statusFor = useCallback((project: Project): Exclude<Filter, "全部"> => {
    const job = latestForProject(project.id);
    if (!job) return "草稿";
    if (job.status === "queued" || job.status === "running") return "发布中";
    if (job.status === "succeeded") return "已发布";
    return "失败";
  }, [latestForProject]);
  const visibleProjects = useMemo(() => projects.filter((project) =>
    `${project.name} ${project.description}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (filter === "全部" || statusFor(project) === filter),
  ), [filter, projects, query, statusFor]);
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/appfactory/v1/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description, skillProfile }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error?.message || "项目创建失败");
      const project = payload.data as Project | undefined;
      if (!project?.id) throw new Error("项目创建成功，但缺少项目标识");
      router.push(`/appfactory/projects/${encodeURIComponent(project.id)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "项目创建失败");
    } finally {
      setCreating(false);
    }
  };
  return (
    <main className="mx-auto max-w-[1360px] px-4 py-7 sm:px-7 sm:py-9">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0368b3]">
            AI 应用开发平台
          </p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-[#0d0d0d]">
            我的应用{" "}
            <span className="ml-2 text-[13px] font-medium tracking-normal text-[#98a2b3]">
              · {projects.length} 个项目
            </span>
          </h1>
          <p className="mt-2 text-sm text-[#667085]">
            从自然语言需求开始，和 AI 一起完成设计、开发与发布。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 rounded-lg bg-[#0368b3] px-5 text-sm font-medium text-white shadow-[0_5px_12px_rgba(3,104,179,.18)] transition hover:bg-[#1a4d87]"
        >
          + 新建项目
        </button>
      </div>
      {error && (
        <div className="mb-5 rounded-lg border border-[#f3c6c2] bg-[#fff5f4] px-4 py-3 text-sm text-[#b9382f]">
          {error}
        </div>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#d4dde8] pb-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`h-8 rounded-full border px-3 text-xs transition ${filter === item ? "border-[#bfd7f2] bg-[#eef5fd] font-medium text-[#1a4d87]" : "border-[#e5ebf2] bg-white text-[#667085] hover:border-[#bfd7f2]"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索项目"
          className="h-9 w-full rounded-lg border border-[#dbe5f0] bg-white px-3 text-sm outline-none transition focus:border-[#6f96c4] sm:w-64"
        />
      </div>
      {loading ? (
        <div className="rounded-xl border border-dashed border-[#cfd8e3] bg-white p-16 text-center text-sm text-[#98a2b3]">
          加载项目中…
        </div>
      ) : visibleProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#cfd8e3] bg-white p-16 text-center">
          <p className="text-sm font-medium text-[#4d4d4d]">
            {projects.length === 0
              ? "还没有应用项目"
              : query
                ? "没有匹配的项目"
                : "当前筛选没有项目"}
          </p>
          <p className="mt-2 text-xs text-[#98a2b3]">
            创建一个项目，让 AI 帮你把想法变成可运行的应用。
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((project) => (
            <Link
              key={project.id}
              href={`/appfactory/projects/${project.id}`}
              className="group rounded-xl border border-[#d6e0eb] bg-white p-5 shadow-[0_4px_10px_rgba(15,23,42,.04)] transition hover:-translate-y-0.5 hover:border-[#6f96c4] hover:shadow-[0_12px_24px_rgba(15,23,42,.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eef5fd] text-lg">
                  ◈
                </span>
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${statusFor(project) === "已发布" ? "bg-[#eef8f2] text-[#1f8a57]" : statusFor(project) === "失败" ? "bg-[#fff5f4] text-[#b9382f]" : statusFor(project) === "发布中" ? "bg-[#fff7e8] text-[#b06d13]" : "bg-[#eef5fd] text-[#1a4d87]"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full bg-current ${statusFor(project) === "发布中" ? "animate-pulse" : ""}`} />
                  {statusFor(project)}
                </span>
              </div>
              <h2 className="mt-4 truncate text-[15px] font-semibold text-[#1a4d87] group-hover:text-[#0368b3]">
                {project.name}
              </h2>
              <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-[#667085]">
                {project.description || "暂无描述，进入项目开始与 AI 对话。"}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-[#edf1f5] pt-3 text-[10px] text-[#98a2b3]">
                <span>{project.skillProfile || "nextjs-build"}</span>
                <span>
                  {new Date(project.updatedAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {open && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 grid place-items-center bg-[#0b3558]/25 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            onSubmit={create}
            className="w-full max-w-lg rounded-2xl border border-[#d4dde8] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.2)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#0368b3]">
                  新建应用
                </p>
                <h2
                  id="create-project-title"
                  className="mt-1 text-lg font-semibold text-[#0d0d0d]"
                >
                  开始一个新的开发项目
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className="text-xl leading-none text-[#98a2b3] hover:text-[#4d4d4d]"
              >
                ×
              </button>
            </div>
            <label className="mt-6 block text-xs font-medium text-[#4d4d4d]">
              项目名称
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例如：设备巡检看板"
                className="mt-2 h-10 w-full rounded-lg border border-[#dbe5f0] px-3 text-sm outline-none focus:border-[#2e7dd2]"
              />
            </label>
            <label className="mt-4 block text-xs font-medium text-[#4d4d4d]">
              项目描述
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="告诉 AI 这个应用要解决什么问题"
                className="mt-2 min-h-24 w-full resize-none rounded-lg border border-[#dbe5f0] px-3 py-2 text-sm outline-none focus:border-[#2e7dd2]"
              />
            </label>
            <div className="mt-4">
              <label className="text-xs font-medium text-[#4d4d4d]">
                模板 / Skill
                <select
                  value={skillProfile}
                  onChange={(event) => setSkillProfile(event.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-[#dbe5f0] bg-white px-3 text-sm outline-none focus:border-[#2e7dd2]"
                >
                  <option value="nextjs-build">Next.js 应用</option>
                </select>
              </label>
            </div>
            <p className="mt-4 rounded-lg bg-[#f6f8fb] px-3 py-2 text-xs leading-5 text-[#667085]">
              默认会创建独立 Workspace。完成开发后点击“发布”，应用将自动加入应用中心。
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 rounded-lg border border-[#d4dde8] px-4 text-sm text-[#667085] hover:bg-[#f6f8fb]"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={creating || !name.trim()}
                className="h-9 rounded-lg bg-[#0368b3] px-4 text-sm font-medium text-white hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "创建中…" : "创建项目"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
