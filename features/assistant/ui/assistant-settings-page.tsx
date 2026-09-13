"use client";

import { useState } from "react";

import type { AssistantSettings } from "../settings";

type AssistantSettingsPageProps = {
  initialSettings: AssistantSettings;
};

export function AssistantSettingsPage({ initialSettings }: AssistantSettingsPageProps) {
  const [unmatchedGuide, setUnmatchedGuide] = useState(initialSettings.unmatchedGuide);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/platform/assistant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unmatchedGuide }),
      });
      const payload = await response.json() as { data?: AssistantSettings; error?: { message?: string } };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || "保存失败");
      setUnmatchedGuide(payload.data.unmatchedGuide);
      setMessage("已保存");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl rounded-2xl border border-[#dce6ef] bg-white p-5 shadow-[0_5px_18px_rgba(24,49,78,0.05)] sm:p-7">
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[#244e70]">AI 助手</h1>
        <p className="mt-2 text-[13px] leading-6 text-[#687d91]">当请求未命中可执行技能，也没有明显相关的应用、技能或业务 API 时，助手会显示这段说明及固定跳转入口。</p>
      </div>
      <label className="mt-6 block">
        <span className="text-[13px] font-medium text-[#38566f]">无匹配引导文案</span>
        <textarea value={unmatchedGuide} onChange={(event) => setUnmatchedGuide(event.target.value)} maxLength={500} rows={5} className="mt-2 w-full resize-y rounded-xl border border-[#d4e0ea] bg-[#fbfcfd] px-3 py-2.5 text-[13px] leading-6 text-[#263b50] outline-none transition-colors placeholder:text-[#98a8b8] focus:border-[#77a5cc] focus:bg-white focus:ring-4 focus:ring-[#edf5fb]" />
        <span className="mt-1.5 block text-right text-[11px] text-[#8a9bab]">{unmatchedGuide.length}/500</span>
      </label>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#edf1f5] pt-5">
        <span role="status" className={`text-[12px] ${message === "已保存" ? "text-emerald-700" : "text-rose-600"}`}>{message}</span>
        <button type="button" disabled={saving || !unmatchedGuide.trim()} onClick={() => void save()} className="inline-flex h-9 items-center rounded-lg bg-[#0368b3] px-4 text-[13px] font-medium text-white shadow-[0_5px_12px_rgba(3,104,179,0.16)] transition-colors hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:bg-[#8bb6db]">{saving ? "保存中…" : "保存设置"}</button>
      </div>
    </section>
  );
}
