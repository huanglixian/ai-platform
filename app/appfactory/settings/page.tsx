"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type ModelProfileId = "zhipu" | "deepseek";
type ThinkingLevel = "low" | "high" | "max";

type RuntimeStatus = {
  harness?: { ready?: boolean; name?: string };
  templates?: Array<{ id: string; name: string; ready?: boolean }>;
};

type ModelProfile = {
  id: ModelProfileId;
  label: string;
  provider: string;
  description: string;
  model: string;
  configured: boolean;
};

type ModelSettings = {
  defaultModelProfileId: ModelProfileId;
  thinkingLevel: ThinkingLevel;
  profiles: ModelProfile[];
};

type ModelSettingsForm = Pick<
  ModelSettings,
  "defaultModelProfileId" | "thinkingLevel"
>;

function StatusDot({ ready }: { ready: boolean }) {
  return (
    <span
      className={`h-2 w-2 rounded-full ${ready ? "bg-[#1f8a57]" : "bg-[#d08a33]"}`}
      aria-hidden="true"
    />
  );
}

async function getErrorMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return payload?.error?.message ?? "请求失败，请稍后重试";
}

export default function AppFactorySettingsPage() {
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [settings, setSettings] = useState<ModelSettings | null>(null);
  const [form, setForm] = useState<ModelSettingsForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setRefreshing(true);
    setLoadError(null);
    try {
      const [statusResponse, settingsResponse] = await Promise.all([
        fetch("/api/appfactory/v1/runtime/status"),
        fetch("/api/appfactory/v1/settings/model"),
      ]);
      if (!statusResponse.ok) throw new Error(await getErrorMessage(statusResponse));
      if (!settingsResponse.ok) throw new Error(await getErrorMessage(settingsResponse));

      const statusPayload = (await statusResponse.json()) as { data?: RuntimeStatus };
      const settingsPayload = (await settingsResponse.json()) as { data?: ModelSettings };
      if (!settingsPayload.data) throw new Error("未能读取模型设置");

      setStatus(statusPayload.data ?? {});
      setSettings(settingsPayload.data);
      setForm({
        defaultModelProfileId: settingsPayload.data.defaultModelProfileId,
        thinkingLevel: settingsPayload.data.thinkingLevel,
      });
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : "读取设置失败，请稍后重试");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const selectedProfile = useMemo(
    () => settings?.profiles.find((profile) => profile.id === form?.defaultModelProfileId),
    [form?.defaultModelProfileId, settings?.profiles],
  );
  const hasChanges = Boolean(
    settings &&
      form &&
      (settings.defaultModelProfileId !== form.defaultModelProfileId ||
        settings.thinkingLevel !== form.thinkingLevel),
  );
  const harnessReady = Boolean(status?.harness?.ready);
  const templates = status?.templates ?? [];
  const templatesReady = Boolean(templates.length) && templates.every((template) => template.ready);

  const updateForm = (change: Partial<ModelSettingsForm>) => {
    setForm((current) => (current ? { ...current, ...change } : current));
    setSaveMessage(null);
    setSaveError(null);
  };

  const saveSettings = async () => {
    if (!form) return;

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/appfactory/v1/settings/model", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));

      const payload = (await response.json()) as { data?: ModelSettings };
      if (!payload.data) throw new Error("模型设置保存失败");

      setSettings(payload.data);
      setForm({
        defaultModelProfileId: payload.data.defaultModelProfileId,
        thinkingLevel: payload.data.thinkingLevel,
      });
      setSaveMessage("已保存：模型将用于新建对话，思考程度下次执行生效");
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

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
            选择新建对话使用的模型档案，并设置所有对话的思考程度。模型名和密钥只由服务端环境变量管理。
          </p>
        </div>
        <Link
          href="/appfactory"
          className="hidden text-sm text-[#0368b3] hover:text-[#1a4d87] sm:inline"
        >
          返回项目
        </Link>
      </div>

      <section className="rounded-xl border border-[#d6e0eb] bg-white p-5 shadow-[0_4px_10px_rgba(15,23,42,.04)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <StatusDot ready={Boolean(selectedProfile?.configured)} />
              <h2 className="text-sm font-semibold text-[#1a4d87]">默认代码模型档案</h2>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-[#667085]">
              默认档案仅影响之后新建的对话；已有对话保留创建时的档案，实际模型名每次运行读取环境变量，思考程度在下次执行时生效。
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              selectedProfile?.configured
                ? "bg-[#eef8f2] text-[#1f8a57]"
                : "bg-[#fff7e8] text-[#b06d13]"
            }`}
          >
            {loading ? "读取中" : selectedProfile?.configured ? "配置完整" : "待配置模型名或 API Key"}
          </span>
        </div>

        {loadError ? (
          <div className="mt-5 rounded-lg border border-[#f0c5c1] bg-[#fff5f4] px-3 py-2 text-xs text-[#b9382f]">
            {loadError}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#4d4d4d]">模型档案</span>
              <select
                value={form?.defaultModelProfileId ?? ""}
                disabled={loading || !form}
                onChange={(event) => updateForm({ defaultModelProfileId: event.target.value as ModelProfileId })}
                className="h-10 w-full rounded-lg border border-[#bfd7f2] bg-white px-3 text-sm text-[#1f2937] outline-none transition focus:border-[#0368b3] focus:ring-2 focus:ring-[#d8eaf9] disabled:cursor-not-allowed disabled:bg-[#f6f8fb] disabled:text-[#98a2b3]"
              >
                {settings?.profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label} · {profile.provider}{profile.configured ? "" : "（待配置）"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#4d4d4d]">思考程度</span>
              <select
                value={form?.thinkingLevel ?? ""}
                disabled={loading || !form}
                onChange={(event) => updateForm({ thinkingLevel: event.target.value as ThinkingLevel })}
                className="h-10 w-full rounded-lg border border-[#bfd7f2] bg-white px-3 text-sm text-[#1f2937] outline-none transition focus:border-[#0368b3] focus:ring-2 focus:ring-[#d8eaf9] disabled:cursor-not-allowed disabled:bg-[#f6f8fb] disabled:text-[#98a2b3]"
              >
                <option value="low">低</option>
                <option value="high">高</option>
                <option value="max">最大</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => void saveSettings()}
              disabled={!hasChanges || saving || loading}
              className="h-10 rounded-lg bg-[#0368b3] px-4 text-xs font-medium text-white transition hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "保存中…" : "保存设置"}
            </button>
          </div>
        )}

        {selectedProfile && !loadError ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#e8edf3] pt-3 text-xs">
            <span className="font-medium text-[#4d4d4d]">{selectedProfile.provider}</span>
            <span className="text-[#667085]">实际模型：{selectedProfile.model || "未配置"}</span>
            <span className="text-[#667085]">{selectedProfile.description}</span>
            {!selectedProfile.configured && (
              <span className="text-[#b06d13]">可保存为默认模型，运行前需配置模型名和 API Key。</span>
            )}
          </div>
        ) : null}

        {saveMessage ? <p className="mt-3 text-xs text-[#1f8a57]">{saveMessage}</p> : null}
        {saveError ? <p className="mt-3 text-xs text-[#b9382f]">{saveError}</p> : null}
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2">
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
            <div className="flex items-center gap-2"><StatusDot ready={templatesReady} /><h2 className="text-sm font-semibold text-[#1a4d87]">项目模板</h2></div>
            <span className="text-xs text-[#98a2b3]">{templatesReady ? "已加载" : "缺失"}</span>
          </div>
          <p className="mt-5 text-sm font-medium text-[#4d4d4d]">{templates.length ? templates.map((template) => template.name).join("、") : "未加载模板"}</p>
          <p className="mt-2 text-xs leading-5 text-[#667085]">模板决定项目的初始 Workspace、开发说明和 Preview、发布所使用的运行时。</p>
        </article>
      </section>

      <section className="mt-5 rounded-xl border border-[#d6e0eb] bg-white p-5 shadow-[0_4px_10px_rgba(15,23,42,.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-sm font-semibold text-[#1a4d87]">发布服务</h2><p className="mt-1 text-xs text-[#667085]">每个项目发布时都会自动注册到应用中心；发布过程由后台 Worker 持续执行。</p></div>
          <button type="button" onClick={() => void loadSettings()} disabled={refreshing || saving} className="h-9 rounded-lg border border-[#bfd7f2] px-3 text-xs font-medium text-[#0368b3] hover:bg-[#eef5fd] disabled:opacity-50">{refreshing ? "检测中…" : "重新检测"}</button>
        </div>
      </section>
    </main>
  );
}
