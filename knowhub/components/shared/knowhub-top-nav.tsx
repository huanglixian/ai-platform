"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const primaryItems = [
  { label: "概览", href: "/knowhub" },
  { label: "文档中心", href: "/knowhub/docspace" },
  { label: "策略中心", href: "/knowhub/strategies" },
  { label: "知识中心", href: "/knowhub/knowledge" },
  { label: "配置管理", href: "/knowhub/settings/global-strategies" },
] as const;

const secondaryItems = [
  { label: "全局策略", href: "/knowhub/settings/global-strategies" },
  { label: "Embedding", href: "/knowhub/settings/embedding" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/knowhub") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function KnowHubTopNav() {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/knowhub/settings");

  return (
    <section className="rounded-[14px] border border-[#d8e1eb] bg-white/94 px-5 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
              KnowHub
            </div>
            <div className="mt-1 text-[12px] text-[#7b8798]">
              知识接入、处理、检索与发布
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1 xl:justify-center">
            {primaryItems.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "border-b-2 px-2 py-1.5 text-[14px] font-semibold tracking-[-0.01em] transition-colors",
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

        {settingsActive ? (
          <nav className="flex flex-wrap items-center gap-2 border-t border-[#e7edf4] pt-3">
            {secondaryItems.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                    active
                      ? "border-[#c7d7ea] bg-[#e9f0f8] text-[#1a4d87]"
                      : "border-[#d9e3ed] bg-white text-[#667085] hover:border-[#c7d7ea] hover:text-title"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
    </section>
  );
}
