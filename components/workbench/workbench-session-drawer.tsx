"use client";

import { useEffect, type ReactNode } from "react";

type WorkbenchSessionDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function WorkbenchSessionDrawer({
  open,
  onClose,
  children,
}: WorkbenchSessionDrawerProps) {
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
    <div className="fixed inset-0 z-40 flex bg-[#08111f]/20">
      <div className="flex h-full w-full max-w-[340px] flex-col border-r border-[#dbe5f0] bg-white shadow-[20px_0_40px_rgba(15,23,42,0.12)]">
        <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
          <div className="text-[15px] font-semibold text-title">会话列表</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[#dbe5f0] px-3 py-1.5 text-[12px] font-medium text-[#51657d] transition-colors hover:bg-[#f7fafc]"
          >
            关闭
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="h-full flex-1"
        aria-label="关闭会话抽屉"
      />
    </div>
  );
}
