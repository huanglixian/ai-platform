"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { studioNavItems } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/96 backdrop-blur">
      <div className="mx-auto flex h-15 w-full max-w-[1440px] items-center gap-6 px-5 sm:px-8">
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

        <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
          {studioNavItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "border-b-2 px-3 py-4 text-sm font-medium transition-colors",
                  active
                    ? "border-[#0368b3] text-title"
                    : "border-transparent text-[#4d4d4d] hover:text-title",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-3 sm:flex">
          <div className="rounded-md border border-border bg-surface-muted px-4 py-2 text-sm text-tertiary">
            搜索
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#0d0d0d] bg-[#0d0d0d] text-sm font-semibold text-white">
            U
          </div>
        </div>
      </div>
    </header>
  );
}
