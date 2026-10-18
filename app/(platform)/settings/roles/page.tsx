import { ShieldCheck, Check } from "lucide-react";
import { requirePageUser } from "@/features/auth/server";
import { listRoles } from "@/features/auth/users";
import { permissionLabels, type Permission } from "@/features/auth/types";

export default async function RolesPage() {
  await requirePageUser("roles.manage");
  const roles = listRoles();
  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-6">
        <p className="text-xs font-medium text-[var(--skin-primary)]">
          配置管理
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-title">
          角色管理
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          四个内置角色定义平台职责，应用可见范围独立管理
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <article
            key={role.code}
            className="rounded-2xl border border-[var(--skin-border)] bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--skin-surface-accent)] text-[var(--skin-primary)]">
                <ShieldCheck size={20} strokeWidth={1.5} />
              </span>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-title">
                  {role.name}
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {role.description}
                </p>
              </div>
              <span className="rounded-md border border-border bg-slate-50 px-2 py-1 text-[10px] text-slate-400">
                内置
              </span>
            </div>
            <div className="my-5 border-t border-border" />
            <p className="mb-3 text-xs text-muted-foreground">
              已分配 {role.memberCount} 人
            </p>
            <ul className="grid gap-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check size={13} className="text-emerald-600" />
                使用向自己开放的应用
              </li>
              {role.permissions.map((permission) => (
                <li key={permission} className="flex items-center gap-2">
                  <Check size={13} className="text-emerald-600" />
                  {permissionLabels[permission as Permission] ?? permission}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
