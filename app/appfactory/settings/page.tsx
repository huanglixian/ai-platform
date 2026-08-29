"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type RuntimeStatus = {
  ai?: { configured?: boolean; provider?: string | null; model?: string | null };
  harness?: { ready?: boolean; name?: string };
  skill?: { ready?: boolean; name?: string };
};

function StatusDot({ ready }: { ready: boolean }) {
  return (
    <span
      className={`h-2 w-2 rounded-full ${ready ? "bg-[#1f8a57]" : "bg-[#d08a33]"}`}
      aria-hidden="true"
    />
  );
}

export default function AppFactorySettingsPage() {
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStatus = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/appfactory/v1/runtime/status");
      const payload = (await response.json()) as { data?: RuntimeStatus };
      setStatus(payload.data ?? {});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const aiReady = Boolean(status?.ai?.configured);
  const harnessReady = Boolean(status?.harness?.ready);
  const skillReady = Boolean(status?.skill?.ready);

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-7 sm:px-7 sm:py-9">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0368b3]">
            AppFactory 设置
          </p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-[#0d0d0d]">
            运行环境
          </h1>
          <p className="mt-2 text-sm text-[#667085]">
            检查 AI、Pi Harness 和默认 Coding Skill。密钥只由服务端环境变量管理。
          </p>
        </div>
        <Link
          href="/appfactory"
          className="hidden text-sm text-[#0368b3] hover:text-[#1a4d87] sm:inline"
        >
          返回项目
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-[#d6e0eb] bg-white p-5 shadow-[0_4px_10px_rgba(15,23,42,.04)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot ready={aiReady} />
              <h2 className="text-sm font-semibold text-[#1a4d87]">AI 模型</h2>
            </div>
            <span className="text-xs text-[#98a2b3]">{loading ? "检测中" : aiReady ? "已就绪" : "待配置"}</span>
          </div>
          <dl className="mt-5 space-y-3 text-xs">
            <div className="flex justify-between gap-3"><dt className="text-[#98a2b3]">Provider</dt><dd className="font-medium text-[#4d4d4d]">{status?.ai?.provider ?? "未配置"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#98a2b3]">模型</dt><dd className="max-w-[190px] truncate font-medium text-[#4d4d4d]">{status?.ai?.model ?? "未配置"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#98a2b3]">凭据</dt><dd className="font-medium text-[#4d4d4d]">{aiReady ? "服务端已配置" : "需要设置 API Key"}</dd></div>
          </dl>
        </article>

        <article className="rounded-xl border border-[#d6e0eb] bg-white p-5 shadow-[0_4px_10px_rgba(15,23,42,.04)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><StatusDot ready={harnessReady} /><h2 className="text-sm font-semibold text-[#1a4d87]">Pi Harness</h2></div>
            <span className="text-xs text-[#98a2b3]">{harnessReady ? "已安装" : "不可用"}</span>
          </div>
          <p className="mt-5 text-sm font-medium text-[#4d4d4d]">{status?.harness?.name ?? "Pi Harness"}</p>
          <p className="mt-2 text-xs leading-5 text-[#667085]">负责在当前项目 Workspace 内理解需求、调用工具和修改文件。</p>
        </article>

        <article className="rounded-xl border border-[#d6e0eb] bg-white p-5 shadow-[0_4px_10px_rgba(15,23,42,.04)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><StatusDot ready={skillReady} /><h2 className="text-sm font-semibold text-[#1a4d87]">默认 Coding Skill</h2></div>
            <span className="text-xs text-[#98a2b3]">{skillReady ? "已加载" : "缺失"}</span>
          </div>
          <p className="mt-5 text-sm font-medium text-[#4d4d4d]">{status?.skill?.name ?? "nextjs-build"}</p>
          <p className="mt-2 text-xs leading-5 text-[#667085]">使用 Next.js App Router、TypeScript、Tailwind CSS 和 shadcn/ui 作为默认开发约定。</p>
        </article>
      </section>

      <section className="mt-5 rounded-xl border border-[#d6e0eb] bg-white p-5 shadow-[0_4px_10px_rgba(15,23,42,.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-sm font-semibold text-[#1a4d87]">项目级连接</h2><p className="mt-1 text-xs text-[#667085]">新建项目时选择 AgentHub 接入模式；不接入时，AppFactory 仍可独立完成开发、预览和本地发布。</p></div>
          <button type="button" onClick={() => void loadStatus()} disabled={refreshing} className="h-9 rounded-lg border border-[#bfd7f2] px-3 text-xs font-medium text-[#0368b3] hover:bg-[#eef5fd] disabled:opacity-50">{refreshing ? "检测中…" : "重新检测"}</button>
        </div>
        <div className="mt-5 grid gap-3 text-xs sm:grid-cols-3">
          <div className="rounded-lg bg-[#f6f8fb] px-3 py-3"><p className="font-medium text-[#4d4d4d]">独立模式</p><p className="mt-1 leading-5 text-[#808080]">不连接 AgentHub，适合普通应用开发。</p></div>
          <div className="rounded-lg bg-[#f6f8fb] px-3 py-3"><p className="font-medium text-[#4d4d4d]">本地 AgentHub</p><p className="mt-1 leading-5 text-[#808080]">调用当前本机已注册的企业能力。</p></div>
          <div className="rounded-lg bg-[#f6f8fb] px-3 py-3"><p className="font-medium text-[#4d4d4d]">HTTP AgentHub</p><p className="mt-1 leading-5 text-[#808080]">连接配置的独立 AgentHub 服务地址。</p></div>
        </div>
      </section>
    </main>
  );
}
