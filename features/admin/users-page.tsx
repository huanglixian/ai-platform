"use client";

import { useMemo, useState } from "react";
import {
  KeyRound,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { FormDialog } from "@/components/shared/form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { InlineNotice } from "@/components/shared/inline-notice";
import { notify } from "@/features/feedback/notify";
import { useCurrentUser } from "@/features/auth/auth-provider";
import { builtInRoles, type RoleCode } from "@/features/auth/types";

type UserRow = {
  id: string;
  username: string;
  displayName: string;
  status: string;
  roles: string[];
  createdAt: string;
};
const inputClass =
  "mt-1.5 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus:border-[var(--skin-primary)] focus:ring-2 focus:ring-[var(--skin-surface-accent)]";
const quietButton =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40";

export function UsersPage({ initialUsers }: { initialUsers: UserRow[] }) {
  const current = useCurrentUser();
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<UserRow | null | undefined>(undefined);
  const [roles, setRoles] = useState<RoleCode[]>(["internal_user"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState<UserRow | null>(null);
  const [removing, setRemoving] = useState<UserRow | null>(null);
  const visible = useMemo(
    () =>
      users.filter((user) =>
        `${user.username} ${user.displayName}`
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
      ),
    [users, query],
  );
  async function request(url: string, method: string, body?: unknown) {
    const response = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || "操作失败");
    return payload.data;
  }
  async function refresh() {
    setUsers(await request("/api/platform/users", "GET"));
  }
  function edit(user: UserRow | null) {
    setEditing(user);
    setRoles(user ? (user.roles as RoleCode[]) : ["internal_user"]);
    setError("");
  }
  function toggleRole(role: RoleCode, checked: boolean) {
    if (checked && role === "external_user") setRoles([role]);
    else
      setRoles((value) =>
        checked
          ? [...value.filter((item) => item !== "external_user"), role]
          : value.filter((item) => item !== role),
      );
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!roles.length) {
      setError("请至少分配一个角色");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await request(
        editing ? `/api/platform/users/${editing.id}` : "/api/platform/users",
        editing ? "PATCH" : "POST",
        {
          displayName: data.get("displayName"),
          roles,
          ...(editing
            ? { status: data.get("status") }
            : {
                username: data.get("username"),
                password: data.get("password"),
              }),
        },
      );
      if (editing?.id === current?.id) {
        window.location.assign("/login");
        return;
      }
      setEditing(undefined);
      await refresh();
      notify.success(editing ? "用户信息已保存" : "账号已创建");
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  async function reset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetting) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await request(`/api/platform/users/${resetting.id}/password`, "POST", {
        password: data.get("password"),
      });
      if (resetting.id === current?.id) {
        window.location.assign("/login");
        return;
      }
      setResetting(null);
      notify.success("密码已重置，该用户需重新登录");
    } catch (error) {
      setError(error instanceof Error ? error.message : "重置失败");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!removing) return;
    setBusy(true);
    try {
      await request(`/api/platform/users/${removing.id}`, "DELETE");
      setRemoving(null);
      await refresh();
      notify.success("用户已删除");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--skin-primary)]">
            配置管理
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-title">
            用户管理
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            统一创建账号、分配角色与管理登录状态
          </p>
        </div>
        <button
          onClick={() => edit(null)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--skin-primary)] px-4 text-sm font-medium text-white shadow-sm hover:bg-[var(--skin-primary-hover)]"
        >
          <Plus size={16} />
          新建用户
        </button>
      </header>
      <section className="overflow-hidden rounded-2xl border border-[var(--skin-border)] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border p-4">
          <span className="text-xs text-muted-foreground">
            共 <strong className="text-title">{users.length}</strong> 个账号
          </span>
          <label className="flex h-9 w-64 items-center gap-2 rounded-lg border border-input px-3">
            <Search size={14} className="text-slate-400" />
            <input
              aria-label="搜索用户"
              placeholder="搜索账号或姓名"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 text-xs outline-none"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500">
              <tr>
                {["用户", "账号", "角色", "状态", "操作"].map((label) => (
                  <th key={label} className="px-5 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/40">
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2.5 font-medium text-title">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--skin-surface-accent)] text-[var(--skin-primary)]">
                        <UserRound size={15} />
                      </span>
                      {user.displayName}
                      {user.id === current?.id && (
                        <span className="text-[10px] font-normal text-muted-foreground">
                          当前账号
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{user.username}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5">
                      {user.roles.map((code) => (
                        <span
                          key={code}
                          className="rounded-md border border-[var(--skin-border)] bg-[var(--skin-surface-soft)] px-2 py-1 text-[10px] text-[var(--skin-primary)]"
                        >
                          {builtInRoles.find((role) => role.code === code)
                            ?.name ?? code}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 ${user.status === "active" ? "text-emerald-600" : "text-slate-400"}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {user.status === "active" ? "启用" : "停用"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        aria-label={`编辑${user.username}`}
                        onClick={() => edit(user)}
                        className={quietButton}
                      >
                        <Pencil size={12} />
                        编辑
                      </button>
                      <button
                        aria-label={`重置${user.username}密码`}
                        onClick={() => {
                          setResetting(user);
                          setError("");
                        }}
                        className={quietButton}
                      >
                        <KeyRound size={12} />
                        重置密码
                      </button>
                      <button
                        aria-label={`删除${user.username}`}
                        disabled={user.id === current?.id}
                        onClick={() => setRemoving(user)}
                        className={`${quietButton} text-rose-600`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <p className="p-12 text-center text-sm text-muted-foreground">
              没有找到用户
            </p>
          )}
        </div>
      </section>
      <FormDialog
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? "编辑用户" : "新建用户"}
        description="角色由管理员分配；外部用户不能同时拥有内部角色。"
        busy={busy}
      >
        {editing !== undefined && (
          <form
            key={editing?.id ?? "new"}
            onSubmit={save}
            className="space-y-4"
          >
            <label className="block text-xs font-medium text-slate-600">
              账号
              <input
                name="username"
                required
                defaultValue={editing?.username}
                disabled={Boolean(editing)}
                minLength={3}
                maxLength={64}
                autoComplete="off"
                className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400`}
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              姓名
              <input
                name="displayName"
                required
                defaultValue={editing?.displayName}
                maxLength={80}
                className={inputClass}
              />
            </label>
            {!editing && (
              <label className="block text-xs font-medium text-slate-600">
                初始密码
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </label>
            )}
            {editing && (
              <label className="block text-xs font-medium text-slate-600">
                账号状态
                <select
                  name="status"
                  defaultValue={editing.status}
                  className={inputClass}
                >
                  <option value="active">启用</option>
                  <option value="disabled">停用</option>
                </select>
              </label>
            )}
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-slate-600">
                分配角色
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {builtInRoles.map((role) => (
                  <label
                    key={role.code}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-xs ${roles.includes(role.code) ? "border-[var(--skin-primary)] bg-[var(--skin-surface-soft)] text-[var(--skin-primary)]" : "border-border text-slate-600"}`}
                  >
                    <input
                      type="checkbox"
                      checked={roles.includes(role.code)}
                      onChange={(event) =>
                        toggleRole(role.code, event.target.checked)
                      }
                      className="accent-[var(--skin-primary)]"
                    />
                    {role.name}
                  </label>
                ))}
              </div>
            </fieldset>
            {error && <InlineNotice>{error}</InlineNotice>}
            <button
              disabled={busy}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--skin-primary)] text-sm font-medium text-white disabled:opacity-50"
            >
              {busy && <LoaderCircle size={14} className="animate-spin" />}
              {busy ? "保存中…" : editing ? "保存修改" : "创建账号"}
            </button>
          </form>
        )}
      </FormDialog>
      <FormDialog
        open={Boolean(resetting)}
        onClose={() => setResetting(null)}
        title="重置密码"
        description={`为 ${resetting?.displayName ?? ""} 设置新密码，现有登录会话将失效。`}
        busy={busy}
      >
        <form onSubmit={reset} className="space-y-4">
          <label className="block text-xs font-medium text-slate-600">
            新密码
            <input
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              className={inputClass}
            />
          </label>
          {error && <InlineNotice>{error}</InlineNotice>}
          <button
            disabled={busy}
            className="h-10 w-full rounded-lg bg-[var(--skin-primary)] text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "保存中…" : "确认重置"}
          </button>
        </form>
      </FormDialog>
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title="删除用户"
        description={`确定删除 ${removing?.displayName ?? ""}？拥有应用或项目的账号需要保留，可通过停用阻止登录。`}
        pending={busy}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
