"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FormSection } from "@/components/patterns/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RoleDetail, RoleGrant } from "@/server/permissions/service";
import type { DataScope, PermissionDefinition } from "@/server/permissions/types";

const scopeLabels: Record<DataScope, string> = {
  self: "本人",
  department: "本部门",
  department_and_children: "本部门及下级",
  all: "全部",
  custom: "自定义策略",
};

function grantsToMap(grants: RoleGrant[]) {
  return new Map(grants.map((grant) => [grant.permissionCode, grant.dataScope]));
}

export function RoleEditor({
  role,
  permissions,
  canManage,
}: {
  role: RoleDetail;
  permissions: PermissionDefinition[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description || "");
  const [grants, setGrants] = useState(() => grantsToMap(role.grants));
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const setGrantEnabled = (permissionCode: string, enabled: boolean) => {
    setGrants((previous) => {
      const next = new Map(previous);
      if (enabled) next.set(permissionCode, "all");
      else next.delete(permissionCode);
      return next;
    });
  };

  const setGrantScope = (permissionCode: string, dataScope: DataScope) => {
    setGrants((previous) => {
      const next = new Map(previous);
      next.set(permissionCode, dataScope);
      return next;
    });
  };

  const save = () => {
    startTransition(async () => {
      setMessage("");
      const payload = {
        name,
        description,
        grants: [...grants.entries()].map(([permissionCode, dataScope]) => ({ permissionCode, dataScope })),
      };
      const response = await fetch(`/api/system/roles/${role.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(body.error?.message || "保存失败");
        return;
      }
      setMessage("已保存");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-3">
      <FormSection description={`稳定编码：${role.code}`} title="角色信息">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">
            名称
            <Input disabled={!canManage || pending} onChange={(event) => setName(event.target.value)} value={name} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            说明
            <Input disabled={!canManage || pending} onChange={(event) => setDescription(event.target.value)} value={description} />
          </label>
        </div>
      </FormSection>
      <FormSection description="范围只作用于此权限；项目成员、被指派人等规则应使用业务 custom policy。" title="权限与数据范围">
        <div className="grid gap-2 sm:hidden">
          {permissions.map((permission) => {
            const scope = grants.get(permission.code);
            return (
              <article className="grid gap-3 rounded-md border border-border p-3" key={permission.code}>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    aria-label={`启用 ${permission.name}`}
                    checked={Boolean(scope)}
                    disabled={!canManage || pending}
                    onChange={(event) => setGrantEnabled(permission.code, event.target.checked)}
                    type="checkbox"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">{permission.name}</span>
                    <span className="mt-0.5 block break-all text-xs text-muted-foreground">{permission.code}</span>
                  </span>
                </label>
                {scope ? (
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    数据范围
                    <select
                      className="h-9 rounded-md border border-input bg-card px-2 text-sm text-foreground disabled:bg-muted"
                      disabled={!canManage || pending}
                      onChange={(event) => setGrantScope(permission.code, event.target.value as DataScope)}
                      value={scope}
                    >
                      {(Object.entries(scopeLabels) as [DataScope, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                ) : null}
              </article>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto rounded-md border border-border sm:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-medium">启用</th>
                <th className="px-3 py-2.5 font-medium">权限</th>
                <th className="px-3 py-2.5 font-medium">数据范围</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {permissions.map((permission) => {
                const scope = grants.get(permission.code);
                return (
                  <tr key={permission.code}>
                    <td className="px-3 py-2.5">
                      <input
                        aria-label={`启用 ${permission.name}`}
                        checked={Boolean(scope)}
                        disabled={!canManage || pending}
                        onChange={(event) => setGrantEnabled(permission.code, event.target.checked)}
                        type="checkbox"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{permission.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{permission.code}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        className="h-8 min-w-36 rounded-md border border-input bg-card px-2 text-sm disabled:bg-muted"
                        disabled={!scope || !canManage || pending}
                        onChange={(event) => setGrantScope(permission.code, event.target.value as DataScope)}
                        value={scope || "all"}
                      >
                        {(Object.entries(scopeLabels) as [DataScope, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </FormSection>
      {message ? <p className={message === "已保存" ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{message}</p> : null}
      {canManage ? <div><Button disabled={pending} onClick={save}>{pending ? "正在保存…" : "保存角色"}</Button></div> : null}
    </div>
  );
}
