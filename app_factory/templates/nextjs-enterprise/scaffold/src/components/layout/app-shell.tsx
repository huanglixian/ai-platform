"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { navigationItems } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { ThemeSwitcher } from "./theme-switcher";

export function AppShell({
  children,
  appName,
  principal,
  allowedHrefs,
}: {
  children: React.ReactNode;
  appName: string;
  principal: { displayName: string; roleCodes: string[] };
  allowedHrefs: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = navigationItems.filter((item) => allowedHrefs.includes(item.href));
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-800 bg-slate-950 px-4 text-white sm:px-5">
        <Link href="/system/users" className="shrink-0 text-sm font-semibold tracking-tight text-white">
          {appName}
        </Link>
        <nav aria-label="主导航" className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex min-w-max items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors",
                    active ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <ThemeSwitcher />
        <div className="flex shrink-0 items-center gap-2 text-xs text-slate-300">
          <span className="hidden max-w-28 truncate md:inline">{principal.displayName}</span>
          <button
            aria-label="退出登录"
            className="inline-flex size-8 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={() => void logout()}
            type="button"
          >
            <LogOut aria-hidden="true" className="size-4" />
          </button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
