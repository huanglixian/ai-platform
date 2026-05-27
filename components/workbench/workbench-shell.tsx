"use client";

import type { ReactNode, RefObject } from "react";

type WorkbenchShellProps = {
  contentRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  commandPanel: ReactNode;
};

export function WorkbenchShell({
  contentRef,
  children,
  commandPanel,
}: WorkbenchShellProps) {
  return (
    <section className="-ml-6 h-[calc(100vh-104px)] min-h-0 w-[calc(100%+1.5rem)] py-1 sm:-ml-8 sm:w-[calc(100%+2rem)]">
      <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4 overflow-hidden rounded-[18px] bg-white px-5 py-4">
        <div
          ref={contentRef}
          className="min-h-0 overflow-y-auto rounded-[14px] border border-[#dbe5f0] bg-[#eef3f8] px-4 py-4"
        >
          {children}
        </div>

        {commandPanel}
      </div>
    </section>
  );
}
