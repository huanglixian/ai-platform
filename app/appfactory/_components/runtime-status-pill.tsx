"use client";

import { useEffect, useState } from "react";

type RuntimeStatus = {
  ai?: { configured?: boolean; provider?: string | null; model?: string | null };
  harness?: { ready?: boolean };
  skill?: { ready?: boolean };
};

export function RuntimeStatusPill() {
  const [status, setStatus] = useState<RuntimeStatus | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/appfactory/v1/runtime/status")
      .then((response) => response.json())
      .then((payload: { data?: RuntimeStatus }) => {
        if (active) setStatus(payload.data ?? {});
      })
      .catch(() => {
        if (active) setStatus({});
      });
    return () => {
      active = false;
    };
  }, []);

  const ready = Boolean(
    status?.ai?.configured && status.harness?.ready && status.skill?.ready,
  );
  const label = status === null ? "检测 AI" : ready ? "AI 已连接" : "需要设置";

  return (
    <span
      className={[
        "hidden items-center gap-1.5 sm:flex",
        status === null
          ? "text-[#98a2b3]"
          : ready
            ? "text-[#1f8a57]"
            : "text-[#b06d13]",
      ].join(" ")}
      title={
        ready
          ? `${status?.ai?.provider ?? "AI"} · ${status?.ai?.model ?? "已配置"}`
          : "请在项目设置中检查 AI 模型、Pi Harness 和 Coding Skill 配置"
      }
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          status === null
            ? "bg-[#98a2b3]"
            : ready
              ? "bg-[#1f8a57]"
              : "bg-[#d08a33]",
        ].join(" ")}
      />
      {label}
    </span>
  );
}
