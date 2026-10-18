"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { InlineNotice } from "@/components/shared/inline-notice";

export function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/platform/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: data.get("username"),
          password: data.get("password"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "登录失败");
      window.location.assign("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "登录失败");
      setBusy(false);
    }
  }
  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm text-title outline-none transition focus:border-[var(--skin-primary)] focus:ring-3 focus:ring-[var(--skin-surface-accent)]";
  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block text-xs font-semibold text-slate-600">
        账号
        <input
          name="username"
          required
          autoComplete="username"
          maxLength={64}
          autoFocus
          className={inputClass}
          placeholder="请输入账号"
        />
      </label>
      <label className="block text-xs font-semibold text-slate-600">
        密码
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          maxLength={128}
          className={inputClass}
          placeholder="请输入密码"
        />
      </label>
      {error && <InlineNotice>{error}</InlineNotice>}
      <button
        disabled={busy}
        className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--skin-primary)] text-sm font-medium text-white shadow-sm transition hover:bg-[var(--skin-primary-hover)] disabled:opacity-60"
      >
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : null}
        {busy ? "正在登录…" : "登录"}
        {!busy && <ArrowRight size={15} />}
      </button>
    </form>
  );
}
