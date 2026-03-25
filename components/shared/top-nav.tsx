"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { getActiveNavGroup, platformNavGroups } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navItemHints: Record<string, string> = {
  知识库: "知识内容与检索配置",
  数据库: "结构化数据与表管理",
  自由体: "独立智能体与角色管理",
  工作流: "流程编排与节点配置",
  工具中心: "工具接入与调度能力",
  服务中心: "外部服务与连接配置",
  技能中心: "技能封装与能力分发",
  组织管理: "组织结构与协作边界",
  角色管理: "角色权限与职责控制",
  用户管理: "用户账号与成员维护",
};

export function TopNav() {
  const pathname = usePathname();
  const routeGroupKey = getActiveNavGroup(pathname);
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openGroup = openGroupKey
    ? platformNavGroups.find((group) => group.key === openGroupKey)
    : null;

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openGroupPanel(groupKey: string) {
    clearCloseTimer();
    setOpenGroupKey(groupKey);
  }

  function scheduleClosePanel() {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpenGroupKey(null);
    }, 140);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/96 backdrop-blur">
      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8">
        <div className="grid h-15 grid-cols-[auto_1fr_auto] items-center gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white">
              AI
            </div>
            <div className="min-w-0">
              <div className="text-title text-sm font-semibold tracking-tight">
                Ai Platform
              </div>
              <div className="text-tertiary text-xs">我的工作区</div>
            </div>
          </div>

          <nav className="hidden items-center justify-self-center gap-2 lg:flex">
            {platformNavGroups.map((group) => {
              const active =
                routeGroupKey === group.key || openGroupKey === group.key;

              if (group.href) {
                return (
                  <Link
                    key={group.key}
                    href={group.href}
                    onMouseEnter={() => setOpenGroupKey(null)}
                    className={[
                      "border-b-2 px-3 py-4 text-[14px] font-semibold tracking-[-0.01em] transition-colors",
                      active
                        ? "border-[#0368b3] text-title"
                        : "border-transparent text-[#4d4d4d] hover:text-title",
                    ].join(" ")}
                  >
                    {group.label}
                  </Link>
                );
              }

              return (
                <div
                  key={group.key}
                  className="relative"
                  onMouseEnter={() => openGroupPanel(group.key)}
                  onMouseLeave={scheduleClosePanel}
                >
                  <button
                    type="button"
                    onFocus={() => openGroupPanel(group.key)}
                    onClick={() =>
                      setOpenGroupKey((current) =>
                        current === group.key ? null : group.key
                      )
                    }
                    className={[
                      "border-b-2 px-3 py-4 text-[14px] font-semibold tracking-[-0.01em] transition-colors",
                      active
                        ? "border-[#0368b3] text-title"
                        : "border-transparent text-[#4d4d4d] hover:text-title",
                    ].join(" ")}
                  >
                    {group.label}
                  </button>

                  {openGroup?.key === group.key && group.items?.length ? (
                    <div
                      className="absolute left-1/2 top-full z-50 mt-2 w-[320px] -translate-x-1/2 rounded-[14px] border border-[#dbe5f0] bg-white/98 p-1.5 shadow-[0_18px_36px_rgba(15,23,42,0.10)] backdrop-blur"
                      onMouseEnter={clearCloseTimer}
                      onMouseLeave={scheduleClosePanel}
                    >
                      <div className="grid gap-1">
                        {group.items.map((item) => {
                          const hint = navItemHints[item.label] ?? "";

                          if (!item.href || item.disabled) {
                            return (
                              <div
                                key={item.label}
                                className="rounded-[10px] border border-[#edf2f7] bg-[#fafbfd] px-3.5 py-2.5"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#7b8798]">
                                    {item.label}
                                  </div>
                                  <div className="rounded-full border border-[#e6edf5] bg-white px-2 py-0.5 text-[9px] font-medium text-[#98a2b3]">
                                    待开放
                                  </div>
                                </div>
                                <div className="mt-1 text-[11px] leading-4.5 text-[#98a2b3]">
                                  {hint}
                                </div>
                              </div>
                            );
                          }

                          const active = isActive(pathname, item.href);

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setOpenGroupKey(null)}
                              className={[
                                "rounded-[10px] border px-3.5 py-2.5 transition-colors",
                                active
                                  ? "border-[#d8e8fa] bg-[#eef5fd]"
                                  : "border-transparent bg-white hover:border-[#e2ebf5] hover:bg-[#f8fbfe]",
                              ].join(" ")}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-[13.5px] font-semibold tracking-[-0.01em] text-title">
                                  {item.label}
                                </div>
                                <div
                                  className={[
                                    "text-[9px] font-medium",
                                    active
                                      ? "text-[#1a4d87]"
                                      : "text-[#98a2b3]",
                                  ].join(" ")}
                                >
                                  进入
                                </div>
                              </div>
                              <div className="mt-1 text-[11px] leading-4.5 text-[#7f8ea3]">
                                {hint}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="hidden items-center justify-self-end gap-3 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#0d0d0d] bg-[#0d0d0d] text-sm font-semibold text-white">
              U
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
