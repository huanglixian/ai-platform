"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  pending?: boolean;
  confirmLabel?: string;
};

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, pending = false, confirmLabel = "删除" }: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(value) => { if (!pending) onOpenChange(value); }}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[80] bg-slate-950/30 backdrop-blur-[2px]" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[81] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl focus:outline-none">
          <span className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-rose-600"><TriangleAlert size={19} /></span>
          <AlertDialog.Title className="text-base font-semibold text-slate-900">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-6 text-slate-600">{description}</AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Close disabled={pending} className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[var(--skin-ring)] disabled:opacity-50">取消</AlertDialog.Close>
            <button type="button" onClick={onConfirm} disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-3 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-50">{pending ? <LoaderCircle size={15} className="animate-spin" /> : null}{pending ? "处理中…" : confirmLabel}</button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
