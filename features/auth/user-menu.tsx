"use client";

import { Menu } from "@base-ui/react/menu";
import { KeyRound, LogOut, UserRound } from "lucide-react";
import { useState } from "react";
import { FormDialog } from "@/components/shared/form-dialog";
import { notify } from "@/features/feedback/notify";
import { useCurrentUser } from "./auth-provider";

export function UserMenu() {
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirm")) {
      notify.error("两次输入的新密码不一致");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/platform/auth/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.get("currentPassword"),
          password: data.get("password"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "修改失败");
      window.location.assign("/login");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "修改失败");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    try {
      const response = await fetch("/api/platform/auth/logout", {
        method: "POST",
      });
      if (!response.ok && response.status !== 401)
        throw new Error("退出失败，请重试");
      window.location.assign("/login");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "退出失败");
    }
  }
  if (!user) return null;
  const inputClass =
    "mt-1.5 h-10 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-[var(--skin-primary)] focus:ring-2 focus:ring-[var(--skin-surface-accent)]";
  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          aria-label="账号菜单"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--skin-border)] bg-[var(--skin-surface-soft)] py-1.5 pl-1.5 pr-3 text-xs font-medium text-[var(--skin-text)]"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--skin-surface-accent)] text-[var(--skin-primary)]">
            <UserRound size={15} />
          </span>
          <span className="max-w-24 truncate">{user.displayName}</span>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={8} className="z-50">
            <Menu.Popup className="min-w-48 rounded-xl border border-[var(--skin-border)] bg-white p-1.5 shadow-xl outline-none">
              <div className="border-b border-border px-3 py-2">
                <p className="text-xs font-semibold text-title">
                  {user.displayName}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {user.username}
                </p>
              </div>
              <Menu.Item
                onClick={() => setOpen(true)}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-xs outline-none data-[highlighted]:bg-slate-50"
              >
                <KeyRound size={14} />
                修改密码
              </Menu.Item>
              <Menu.Item
                onClick={() => void logout()}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-rose-600 outline-none data-[highlighted]:bg-rose-50"
              >
                <LogOut size={14} />
                退出登录
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="修改密码"
        description="修改后需要重新登录，其他设备上的登录也将失效。"
        busy={busy}
      >
        <form className="space-y-4" onSubmit={changePassword}>
          {[
            {
              name: "currentPassword",
              label: "当前密码",
              autoComplete: "current-password",
            },
            { name: "password", label: "新密码", autoComplete: "new-password" },
            {
              name: "confirm",
              label: "确认新密码",
              autoComplete: "new-password",
            },
          ].map((field) => (
            <label
              key={field.name}
              className="block text-xs font-medium text-slate-600"
            >
              {field.label}
              <input
                name={field.name}
                type="password"
                autoComplete={field.autoComplete}
                required
                minLength={field.name === "currentPassword" ? 1 : 8}
                maxLength={128}
                className={inputClass}
              />
            </label>
          ))}
          <button
            disabled={busy}
            className="h-10 w-full rounded-lg bg-[var(--skin-primary)] text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "保存中…" : "保存并重新登录"}
          </button>
        </form>
      </FormDialog>
    </>
  );
}
