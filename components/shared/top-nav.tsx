"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { getActiveNavGroup, platformNavGroups } from "@/lib/nav";
import { SkinSwitcher } from "@/features/appearance/skin-switcher";
import { SKINS } from "@/features/appearance/skins";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
      <div className="w-full px-6 sm:px-8">
        <div className="relative flex h-[64px] items-center gap-3 xl:gap-6">
          <div className="min-w-0 flex-1 xl:flex-none">
            {SKINS.map((skin) => (
              <div key={skin.id} data-skin-brand={skin.id} className="flex min-w-0 items-center gap-3">
                <Link href="/" aria-label={`${skin.logoAlt}首页`} className="shrink-0">
                  <Image src={skin.logo} alt={skin.logoAlt} width={90} height={84} unoptimized className="h-9 w-[39px] object-contain sm:h-[42px] sm:w-[45px]" />
                </Link>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold tracking-tight text-[var(--skin-text)]">{skin.title}</div>
                  <div className="truncate text-xs text-[var(--skin-text-muted)]">{skin.subtitle}</div>
                </div>
              </div>
            ))}
          </div>

          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 xl:flex">
            {platformNavGroups.map((group) => {
              const active =
                routeGroupKey === group.key || openGroupKey === group.key;

              if (group.href) {
                return (
                  <Link
                    key={group.key}
                    href={group.href}
                    target={group.openInNewTab ? "_blank" : undefined}
                    rel={group.openInNewTab ? "noreferrer" : undefined}
                    onMouseEnter={() => setOpenGroupKey(null)}
                    className={[
                      "border-b-2 px-3 py-[22px] text-[14px] font-semibold tracking-[-0.01em] transition-colors",
                      active
                        ? "border-[var(--skin-primary)] text-title"
                        : "border-transparent text-[var(--skin-text)] hover:text-title",
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
                      "border-b-2 px-3 py-[22px] text-[14px] font-semibold tracking-[-0.01em] transition-colors",
                      active
                        ? "border-[var(--skin-primary)] text-title"
                        : "border-transparent text-[var(--skin-text)] hover:text-title",
                    ].join(" ")}
                  >
                    {group.label}
                  </button>

                  {openGroup?.key === group.key && group.items?.length ? (
                    <div
                      className="absolute left-1/2 top-full z-50 mt-2 w-[320px] -translate-x-1/2 rounded-[14px] border border-[var(--skin-border)] bg-white/98 p-1.5 shadow-[0_18px_36px_rgba(var(--skin-shadow-rgb),0.10)] backdrop-blur"
                      onMouseEnter={clearCloseTimer}
                      onMouseLeave={scheduleClosePanel}
                    >
                      <div className="grid gap-1">
                        {group.items.map((item) => {
                          const hint = item.hint ?? "";

                          if (!item.href || item.disabled) {
                            return (
                              <div
                                key={item.label}
                                className="rounded-[10px] border border-[var(--skin-surface-accent)] bg-[var(--skin-surface-soft)] px-3.5 py-2.5"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--skin-text-subtle)]">
                                    {item.label}
                                  </div>
                                  <div className="rounded-full border border-[var(--skin-border)] bg-white px-2 py-0.5 text-[9px] font-medium text-[var(--skin-text-subtle)]">
                                    待开放
                                  </div>
                                </div>
                                <div className="mt-1 text-[11px] leading-4.5 text-[var(--skin-text-subtle)]">
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
                              target={item.openInNewTab ? "_blank" : undefined}
                              rel={item.openInNewTab ? "noreferrer" : undefined}
                              onClick={() => setOpenGroupKey(null)}
                              className={[
                                "rounded-[10px] border px-3.5 py-2.5 transition-colors",
                                active
                                  ? "border-[var(--skin-border-strong)] bg-[var(--skin-surface-accent)]"
                                  : "border-transparent bg-white hover:border-[var(--skin-border)] hover:bg-[var(--skin-surface-soft)]",
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
                                      ? "text-[var(--skin-primary-hover)]"
                                      : "text-[var(--skin-text-subtle)]",
                                  ].join(" ")}
                                >
                                  {item.openInNewTab ? "新页签 ↗" : "进入"}
                                </div>
                              </div>
                              <div className="mt-1 text-[11px] leading-4.5 text-[var(--skin-text-muted)]">
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

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <SkinSwitcher />
            <div className="hidden h-9 w-9 items-center justify-center rounded-full border border-[var(--skin-border)] bg-[var(--skin-surface-accent)] text-sm font-semibold text-[var(--skin-primary)] md:flex">
              U
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
