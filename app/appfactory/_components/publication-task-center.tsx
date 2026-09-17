"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import {
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  LoaderCircle,
  Rocket,
  RotateCcw,
  Square,
  X,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { parseSseBlock } from "@/app/appfactory/_lib/sse";

type PublicationStage =
  | "queued"
  | "validating"
  | "building"
  | "packaging"
  | "migrating"
  | "deploying"
  | "checking"
  | "registering"
  | "completed";
type PublicationStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
type PublicationEvent = {
  id: string;
  sequence: number;
  stage: PublicationStage;
  level: "info" | "success" | "error";
  message: string;
  createdAt: string;
};
export type PublicationJob = {
  id: string;
  projectId: string;
  status: PublicationStatus;
  stage: PublicationStage;
  step: string;
  completed: number;
  total: number;
  error: string | null;
  attempts: number;
  result: {
    entryUrl: string;
    applicationCenterUrl: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

const stageLabels: Record<Exclude<PublicationStage, "completed">, string> = {
  queued: "排队等待",
  validating: "校验应用",
  building: "构建应用",
  packaging: "打包发布产物",
  migrating: "应用数据库迁移",
  deploying: "启动应用",
  checking: "健康检查",
  registering: "加入应用中心",
};
const stages = Object.entries(stageLabels) as [keyof typeof stageLabels, string][];

type PublicationContextValue = {
  jobs: PublicationJob[];
  publish: (projectId: string) => Promise<PublicationJob>;
  cancel: (jobId: string) => Promise<void>;
  retry: (jobId: string) => Promise<void>;
  openTaskCenter: () => void;
  latestForProject: (projectId: string) => PublicationJob | undefined;
  registerTrigger: (element: HTMLButtonElement | null) => void;
};
const PublicationContext = createContext<PublicationContextValue | null>(null);

function messageFrom(payload: { error?: { message?: string } }, fallback: string) {
  return payload.error?.message || fallback;
}

function isActive(job: PublicationJob) {
  return job.status === "queued" || job.status === "running";
}

function mergeJob(jobs: PublicationJob[], job: PublicationJob) {
  return [job, ...jobs.filter((item) => item.id !== job.id)].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

function mergeEvents(events: PublicationEvent[], incoming: PublicationEvent[]) {
  const byId = new Map(events.map((event) => [event.id, event]));
  incoming.forEach((event) => byId.set(event.id, event));
  return [...byId.values()].sort((left, right) => left.sequence - right.sequence);
}

function JobStatusIcon({ job }: { job: PublicationJob }) {
  if (job.status === "succeeded") return <CheckCircle2 size={16} className="text-[#1f8a57]" />;
  if (job.status === "failed" || job.status === "cancelled") return <X size={16} className="text-[#c94a42]" />;
  return <LoaderCircle size={16} className="animate-spin text-[#0368b3]" />;
}

function JobDetails({ job, events, onCancel, onRetry }: {
  job: PublicationJob;
  events: PublicationEvent[];
  onCancel: () => void;
  onRetry: () => void;
}) {
  const activeIndex = stages.findIndex(([stage]) => stage === job.stage);
  return (
    <div className="publication-job-details">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#173f6b]">发布应用</p>
          <p className="mt-1 text-xs text-[#667085]">{job.step}</p>
        </div>
        <JobStatusIcon job={job} />
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#e6edf5]">
        <div className="h-full rounded-full bg-[#1674c5] transition-all duration-500" style={{ width: `${Math.max(4, (job.completed / Math.max(job.total, 1)) * 100)}%` }} />
      </div>
      <ol className="mt-5 grid gap-2">
        {stages.map(([stage, label], index) => {
          const done = job.status === "succeeded" || index < activeIndex;
          const active = isActive(job) && index === activeIndex;
          return <li key={stage} className="flex items-center gap-2 text-xs text-[#667085]">
            <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${done ? "bg-[#e6f7ee] text-[#1f8a57]" : active ? "bg-[#eaf4ff] text-[#0368b3]" : "bg-[#f1f4f7] text-[#98a2b3]"}`}>
              {done ? <CheckCircle2 size={13} /> : active ? <LoaderCircle size={13} className="animate-spin" /> : index + 1}
            </span>
            <span className={active ? "font-medium text-[#1a4d87]" : ""}>{label}</span>
          </li>;
        })}
      </ol>
      {(job.error || events.length > 0) && <div className="mt-5 rounded-xl bg-[#102c49] p-3 font-mono text-[11px] leading-5 text-[#d9e8f6]">
        {job.error && <p className="text-[#ffb4ae]">{job.error}</p>}
        {events.slice(-5).map((event) => <p key={event.id}><span className="text-[#7db6e8]">[{stageLabels[event.stage as keyof typeof stageLabels] || "完成"}]</span> {event.message}</p>)}
      </div>}
      <div className="mt-5 flex flex-wrap gap-2">
        {isActive(job) && <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4dde8] px-3 py-2 text-xs text-[#667085] hover:border-[#c94a42] hover:text-[#c94a42]"><Square size={12} />取消发布</button>}
        {(job.status === "failed" || job.status === "cancelled") && <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0368b3] px-3 py-2 text-xs font-medium text-white hover:bg-[#1a4d87]"><RotateCcw size={13} />重新发布</button>}
        {job.status === "succeeded" && job.result && <>
          <a href={job.result.entryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#0368b3] px-3 py-2 text-xs font-medium text-white hover:bg-[#1a4d87]"><ExternalLink size={13} />打开应用</a>
          <Link href={job.result.applicationCenterUrl} className="inline-flex items-center gap-1.5 rounded-lg border border-[#bfd7f2] px-3 py-2 text-xs font-medium text-[#0368b3] hover:bg-[#eef5fd]">前往应用中心</Link>
        </>}
      </div>
    </div>
  );
}

export function PublicationTaskCenterProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<PublicationJob[]>([]);
  const [events, setEvents] = useState<Record<string, PublicationEvent[]>>({});
  const [centerOpen, setCenterOpen] = useState(false);
  const [launchJobId, setLaunchJobId] = useState<string | null>(null);
  const [flying, setFlying] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const launchRef = useRef<HTMLDivElement | null>(null);
  const eventCursorsRef = useRef<Record<string, number>>({});

  const receiveEvents = useCallback((jobId: string, incoming: PublicationEvent[]) => {
    if (!incoming.length) return;
    eventCursorsRef.current[jobId] = Math.max(
      eventCursorsRef.current[jobId] || 0,
      ...incoming.map((event) => event.sequence),
    );
    setEvents((current) => ({
      ...current,
      [jobId]: mergeEvents(current[jobId] || [], incoming),
    }));
  }, []);

  const refreshJob = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/appfactory/v1/publication-jobs/${jobId}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(messageFrom(payload, "发布任务读取失败"));
    setJobs((current) => mergeJob(current, payload.data));
    return payload.data as PublicationJob;
  }, []);
  const refreshEvents = useCallback(async (jobId: string, after = 0) => {
    const response = await fetch(`/api/appfactory/v1/publication-jobs/${jobId}/events?after=${after}`);
    const payload = await response.json();
    if (!response.ok) return;
    const incoming = Array.isArray(payload.data) ? payload.data as PublicationEvent[] : [];
    if (!incoming.length) return;
    receiveEvents(jobId, incoming);
  }, [receiveEvents]);
  const refreshJobs = useCallback(async () => {
    const response = await fetch("/api/appfactory/v1/publication-jobs");
    const payload = await response.json();
    if (!response.ok) return;
    const next = Array.isArray(payload.data) ? payload.data as PublicationJob[] : [];
    setJobs(next);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshJobs(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshJobs]);
  const activeJobIds = jobs.filter(isActive).map((job) => job.id).sort().join(",");
  useEffect(() => {
    const jobIds = activeJobIds ? activeJobIds.split(",") : [];
    if (!jobIds.length) return;
    const streams = jobIds.map((jobId) => {
      const source = new EventSource(`/api/appfactory/v1/publication-jobs/${jobId}/stream`);
      source.addEventListener("publication", (raw) => {
        const event = raw as MessageEvent<string>;
        const parsed = parseSseBlock(`data: ${event.data}`);
        const publicationEvent = parsed?.data as PublicationEvent | undefined;
        if (publicationEvent?.id) receiveEvents(jobId, [publicationEvent]);
        void refreshJob(jobId);
      });
      return source;
    });
    const poll = window.setInterval(() => jobIds.forEach((jobId) => {
      void refreshEvents(jobId, eventCursorsRef.current[jobId] || 0);
      void refreshJob(jobId);
    }), 2_500);
    return () => { streams.forEach((source) => source.close()); window.clearInterval(poll); };
  }, [activeJobIds, receiveEvents, refreshEvents, refreshJob]);

  const publish = useCallback(async (projectId: string) => {
    const response = await fetch(`/api/appfactory/v1/projects/${projectId}/publication`, { method: "POST" });
    const payload = await response.json();
    if (!response.ok) throw new Error(messageFrom(payload, "创建发布任务失败"));
    const job = payload.data as PublicationJob;
    setJobs((current) => mergeJob(current, job));
    setLaunchJobId(job.id);
    setFlying(false);
    eventCursorsRef.current[job.id] = eventCursorsRef.current[job.id] || 0;
    setEvents((current) => ({ ...current, [job.id]: current[job.id] || [] }));
    void refreshEvents(job.id);
    return job;
  }, [refreshEvents]);
  const act = useCallback(async (jobId: string, action: "cancel" | "retry") => {
    const response = await fetch(`/api/appfactory/v1/publication-jobs/${jobId}/actions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(messageFrom(payload, action === "cancel" ? "取消失败" : "重试失败"));
    const job = payload.data as PublicationJob;
    setJobs((current) => mergeJob(current, job));
    if (action === "retry") { setLaunchJobId(job.id); setFlying(false); }
  }, []);

  useEffect(() => {
    if (!launchJobId || flying) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const holdDuration = reducedMotion ? 0 : 1_800;
    const flightDuration = reducedMotion ? 0 : 540;
    const timer = window.setTimeout(() => {
      const panel = launchRef.current?.getBoundingClientRect();
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!panel || !trigger) { setLaunchJobId(null); return; }
      const style = launchRef.current?.style;
      style?.setProperty("--publication-fly-x", `${trigger.left + trigger.width / 2 - (panel.left + panel.width / 2)}px`);
      style?.setProperty("--publication-fly-y", `${trigger.top + trigger.height / 2 - (panel.top + panel.height / 2)}px`);
      setFlying(true);
      window.setTimeout(() => { setLaunchJobId(null); setFlying(false); triggerRef.current?.classList.add("publication-trigger-arrival"); window.setTimeout(() => triggerRef.current?.classList.remove("publication-trigger-arrival"), 600); }, flightDuration);
    }, holdDuration);
    return () => window.clearTimeout(timer);
  }, [flying, launchJobId]);

  const value = useMemo<PublicationContextValue>(() => ({
    jobs, publish, cancel: (id) => act(id, "cancel"), retry: (id) => act(id, "retry"), openTaskCenter: () => setCenterOpen(true), latestForProject: (projectId) => jobs.filter((job) => job.projectId === projectId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0], registerTrigger: (element) => { triggerRef.current = element; },
  }), [act, jobs, publish]);
  const launchJob = jobs.find((job) => job.id === launchJobId);
  return <PublicationContext.Provider value={value}>
    {children}
    {launchJob && <Dialog.Root open onOpenChange={(open) => { if (!open && !flying) setLaunchJobId(null); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="publication-launch-backdrop" />
        <Dialog.Popup ref={launchRef} className={`publication-launch-panel ${flying ? "publication-launch-flying" : ""}`}>
          <JobDetails job={launchJob} events={events[launchJob.id] || []} onCancel={() => void act(launchJob.id, "cancel")} onRetry={() => void act(launchJob.id, "retry")} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>}
    <Dialog.Root open={centerOpen} onOpenChange={setCenterOpen} modal={false}>
      <Dialog.Portal>
        <Dialog.Popup className="publication-task-center" initialFocus={false}>
          <div className="flex items-center justify-between border-b border-[#e5ebf2] px-5 py-4"><div><Dialog.Title className="text-sm font-semibold text-[#173f6b]">发布任务中心</Dialog.Title><Dialog.Description className="mt-1 text-xs text-[#98a2b3]">应用发布会在后台持续运行</Dialog.Description></div><Dialog.Close className="rounded-md p-1 text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#4d4d4d]" aria-label="关闭任务中心"><X size={17} /></Dialog.Close></div>
          <div className="min-h-0 flex-1 overflow-auto p-4">{jobs.length ? <div className="space-y-3">{jobs.map((job) => <article key={job.id} className="rounded-xl border border-[#dce5ee] bg-white p-4"><JobDetails job={job} events={events[job.id] || []} onCancel={() => void act(job.id, "cancel")} onRetry={() => void act(job.id, "retry")} /></article>)}</div> : <div className="grid min-h-48 place-items-center text-center"><div><CircleDashed className="mx-auto text-[#bfd7f2]" size={28} /><p className="mt-3 text-sm font-medium text-[#667085]">暂无发布任务</p><p className="mt-1 text-xs text-[#98a2b3]">从项目页发布应用后，进度会显示在这里。</p></div></div>}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  </PublicationContext.Provider>;
}

export function usePublicationTaskCenter() {
  const context = useContext(PublicationContext);
  if (!context) throw new Error("usePublicationTaskCenter 必须在 PublicationTaskCenterProvider 内使用");
  return context;
}

export function PublicationTaskCenterTrigger() {
  const { jobs, openTaskCenter, registerTrigger } = usePublicationTaskCenter();
  const active = jobs.filter(isActive).length;
  return <button type="button" ref={registerTrigger} onClick={openTaskCenter} className="publication-task-center-trigger" aria-label="打开发布任务中心">
    <Rocket size={15} /><span className="hidden sm:inline">任务中心</span>{active > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#0368b3] px-1 text-[9px] font-bold text-white">{active}</span>}
  </button>;
}
