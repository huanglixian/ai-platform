import Link from "next/link";

import { RuntimeStatusPill } from "@/app/appfactory/_components/runtime-status-pill";
import {
  PublicationTaskCenterProvider,
  PublicationTaskCenterTrigger,
} from "@/app/appfactory/_components/publication-task-center";

export default function AppFactoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicationTaskCenterProvider>
    <div className="min-h-screen bg-[#f2f4f7] text-[#262626]">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-[#d4dde8] bg-white/95 px-4 backdrop-blur sm:px-7">
        <div className="flex items-center gap-7">
          <Link
            href="/appfactory"
            className="flex items-center gap-2.5 font-semibold tracking-tight text-[#1a4d87]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[linear-gradient(135deg,#0368b3,#2e7dd2)] text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(3,104,179,.22)]">
              AF
            </span>
            <span>AppFactory</span>
          </Link>
          <nav className="hidden items-center gap-1 text-[13px] text-[#667085] md:flex">
            <Link
              href="/appfactory"
              className="rounded-md bg-[#eef5fd] px-3 py-1.5 font-medium text-[#1a4d87]"
            >
              项目
            </Link>
            <Link
              href="/appfactory/settings"
              className="rounded-md px-3 py-1.5 text-[#667085] transition hover:bg-[#f6f8fb] hover:text-[#1a4d87]"
            >
              设置
            </Link>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs sm:gap-4">
          <RuntimeStatusPill />
          <PublicationTaskCenterTrigger />
          <Link
            href="/workbench"
            className="hidden text-[#667085] transition hover:text-[#0368b3] lg:inline"
          >
            返回 AgentHub ↗
          </Link>
        </div>
      </header>
      {children}
    </div>
    </PublicationTaskCenterProvider>
  );
}
