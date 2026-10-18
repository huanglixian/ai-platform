"use client";

import { Toast } from "@base-ui/react/toast";
import { CircleCheck, CircleAlert, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { notificationManager, type NotificationData } from "./notify";
import "./notifications.css";

const icons = { success: CircleCheck, error: CircleAlert, warning: TriangleAlert, info: Info, loading: LoaderCircle };

function NotificationList() {
  const { toasts } = Toast.useToastManager<NotificationData>();
  return toasts.map((toast) => {
    const type = toast.type as keyof typeof icons;
    const Icon = icons[type] ?? Info;
    return (
      <Toast.Root key={toast.id} toast={toast} className="platform-toast" data-type={type} swipeDirection={toast.data?.details ? [] : undefined}>
        <Toast.Content className="flex items-start gap-3">
          <span className="platform-toast-icon"><Icon size={18} className={type === "loading" ? "animate-spin" : ""} /></span>
          <div className="min-w-0 flex-1">
            <Toast.Title className="text-[13px] font-semibold leading-5 text-slate-800" />
            <Toast.Description className="mt-1 text-xs leading-5 text-slate-500 empty:hidden" />
            {toast.data?.details ? <details data-base-ui-swipe-ignore className="mt-2 text-xs text-slate-600"><summary className="w-fit cursor-pointer font-medium text-[var(--skin-primary)]">查看详情</summary><p className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words leading-5">{toast.data.details}</p></details> : null}
            {toast.actionProps ? <Toast.Action className="mt-2 rounded-md text-xs font-medium text-[var(--skin-primary)] focus-visible:outline-2 focus-visible:outline-[var(--skin-ring)]" /> : null}
          </div>
          <Toast.Close aria-label="关闭通知" className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-[var(--skin-ring)]"><X size={15} /></Toast.Close>
        </Toast.Content>
      </Toast.Root>
    );
  });
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider toastManager={notificationManager} limit={3}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="platform-toast-viewport" aria-label="消息通知"><NotificationList /></Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
