"use client";

import { useEffect } from "react";

type BotConfigEditProps = {
  open: boolean;
  title: string;
  pathLabel: string;
  value: string;
  loading?: boolean;
  saving?: boolean;
  status?: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function BotConfigEdit({
  open,
  title,
  pathLabel,
  value,
  loading = false,
  saving = false,
  status = "",
  onChange,
  onClose,
  onSave,
}: BotConfigEditProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08111f]/45 px-4 py-8">
      <div className="flex max-h-[min(720px,88vh)] w-full max-w-[880px] flex-col overflow-hidden rounded-[20px] border border-[#dbe5f0] bg-white shadow-[0_28px_60px_rgba(8,17,31,0.16)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#eef2f6] px-5 py-4">
          <div className="min-w-0">
            <div className="text-[16px] font-semibold text-title">{title}</div>
            <div className="mt-1 truncate text-[12px] text-[#98a2b3]">
              {pathLabel || "-"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[#dbe5f0] px-3 py-1.5 text-[12px] font-medium text-[#51657d] transition-colors hover:bg-[#f7fafc]"
          >
            关闭
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={loading || saving}
            className="h-[420px] w-full resize-none rounded-[14px] border border-[#dbe5f0] bg-white px-4 py-3 font-mono text-[12px] leading-6 text-title outline-none transition-colors focus:border-[#6f96c4] disabled:bg-[#f8fafc] disabled:text-[#98a2b3]"
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#eef2f6] px-5 py-4">
          <div className="text-[12px] text-[#7f8ea3]">
            {loading ? "正在加载..." : saving ? "正在保存..." : status || " "}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-[36px] rounded-[8px] border border-[#dbe5f0] px-4 text-[13px] font-medium text-[#51657d] transition-colors hover:bg-[#f7fafc]"
            >
              取消
            </button>
            <button
              type="button"
              disabled={loading || saving}
              onClick={onSave}
              className="h-[36px] rounded-[8px] bg-[#0368b3] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:bg-[#7eaed6]"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
