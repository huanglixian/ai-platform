"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function FormDialog({
  open,
  onClose,
  title,
  description,
  children,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
  busy?: boolean;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-[var(--skin-border)] bg-white p-6 shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-title">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 text-xs leading-5 text-muted-foreground">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={busy}
              aria-label="关闭"
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="mt-5">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
