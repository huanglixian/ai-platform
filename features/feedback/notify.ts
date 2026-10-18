"use client";

import { Toast, type ToastManager } from "@base-ui/react/toast";

export type NotificationData = { details?: string };
type NotificationType = "success" | "error" | "warning" | "info" | "loading";
type NotificationOptions = {
  id?: string;
  description?: string;
  details?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
};

export const notificationManager = Toast.createToastManager<NotificationData>();

export function createNotifier(manager: Pick<ToastManager<NotificationData>, "add" | "update" | "close">) {
  const active = new Map<string, string>();

  function show(type: NotificationType, title: string, options: NotificationOptions = {}) {
    const key = options.id ?? `${type}:${title}`;
    const existing = active.get(key);
    const toast = {
      title,
      type,
      description: options.description,
      data: { details: options.details },
      timeout: options.duration ?? (type === "loading" || options.details ? 0 : type === "success" ? 3_000 : 6_000),
      actionProps: options.action ? { children: options.action.label, onClick: options.action.onClick } : undefined,
    };
    if (existing) manager.update(existing, toast);
    else {
      const id = manager.add({ ...toast, onClose: () => { active.delete(key); } });
      active.set(key, id);
    }
    return key;
  }

  return {
    success: (title: string, options?: NotificationOptions) => show("success", title, options),
    error: (title: string, options?: NotificationOptions) => show("error", title, options),
    warning: (title: string, options?: NotificationOptions) => show("warning", title, options),
    info: (title: string, options?: NotificationOptions) => show("info", title, options),
    loading: (title: string, options?: NotificationOptions) => show("loading", title, options),
    dismiss: (key: string) => { const id = active.get(key); if (id) manager.close(id); },
  };
}

export const notify = createNotifier(notificationManager);
