"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const strategyChildren = [
  {
    label: "预处理策略库",
    href: "/knowhub/clean",
    hint: "围绕清洗、归并和结构整理维护规则。",
  },
  {
    label: "切片策略库",
    href: "/knowhub/slices",
    hint: "围绕标题、上下文和问答切片维护规则。",
  },
] as const;

const primaryItems = [
  { label: "概览", href: "/knowhub" },
  { label: "文档中心", href: "/knowhub/documents" },
  { label: "处理中心", href: "/knowhub/pipelines" },
  { label: "知识中心", href: "/knowhub/knowledge" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/knowhub") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isStrategyActive(pathname: string) {
  return pathname === "/knowhub/clean" || pathname.startsWith("/knowhub/clean/")
    || pathname === "/knowhub/slices" || pathname.startsWith("/knowhub/slices/");
}

export function KnowHubTopNav() {
  const pathname = usePathname();
  const [strategyOpen, setStrategyOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const strategyActive = isStrategyActive(pathname);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openStrategyPanel() {
    clearCloseTimer();
    setStrategyOpen(true);
  }

  function scheduleClosePanel() {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setStrategyOpen(false);
    }, 140);
  }

  return (
    <section className="rounded-[14px] border border-[#d8e1eb] bg-white/94 px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
            KnowHub
          </div>
          <div className="mt-1 text-[12px] text-[#7b8798]">
            知识接入、处理、检索与发布
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2 xl:justify-center">
          {primaryItems.slice(0, 2).map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border-b-2 px-2 py-2 text-[14px] font-semibold tracking-[-0.01em] transition-colors",
                  active
                    ? "border-[#0368b3] text-title"
                    : "border-transparent text-[#4d4d4d] hover:text-title"
                )}
              >
                {item.label}
              </Link>
            );
          })}

          <div
            className="relative"
            onMouseEnter={openStrategyPanel}
            onMouseLeave={scheduleClosePanel}
          >
            <button
              type="button"
              onFocus={openStrategyPanel}
              onClick={() => setStrategyOpen((current) => !current)}
              className={cn(
                "border-b-2 px-2 py-2 text-[14px] font-semibold tracking-[-0.01em] transition-colors",
                strategyActive || strategyOpen
                  ? "border-[#0368b3] text-title"
                  : "border-transparent text-[#4d4d4d] hover:text-title"
              )}
            >
              策略中心
            </button>

            {strategyOpen ? (
              <div
                className="absolute left-1/2 top-full z-30 mt-2 w-[320px] -translate-x-1/2 rounded-[14px] border border-[#dbe5f0] bg-white/98 p-1.5 shadow-[0_18px_36px_rgba(15,23,42,0.10)] backdrop-blur"
                onMouseEnter={clearCloseTimer}
                onMouseLeave={scheduleClosePanel}
              >
                <div className="grid gap-1">
                  {strategyChildren.map((item) => {
                    const active = isActive(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setStrategyOpen(false)}
                        className={cn(
                          "rounded-[10px] border px-3.5 py-2.5 transition-colors",
                          active
                            ? "border-[#d8e8fa] bg-[#eef5fd]"
                            : "border-transparent bg-white hover:border-[#e2ebf5] hover:bg-[#f8fbfe]"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-[13.5px] font-semibold tracking-[-0.01em] text-title">
                            {item.label}
                          </div>
                          <div
                            className={cn(
                              "text-[9px] font-medium",
                              active ? "text-[#1a4d87]" : "text-[#98a2b3]"
                            )}
                          >
                            进入
                          </div>
                        </div>
                        <div className="mt-1 text-[11px] leading-4.5 text-[#7f8ea3]">
                          {item.hint}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {primaryItems.slice(2).map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border-b-2 px-2 py-2 text-[14px] font-semibold tracking-[-0.01em] transition-colors",
                  active
                    ? "border-[#0368b3] text-title"
                    : "border-transparent text-[#4d4d4d] hover:text-title"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full justify-center xl:w-auto"
          )}
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          返回平台
        </Link>
      </div>
    </section>
  );
}
