"use client";

import type { ReactNode, RefObject } from "react";

type AssistantConversationShellProps = {
  contentRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  commandPanel: ReactNode;
  header: ReactNode;
};

export function AssistantConversationShell({
  contentRef,
  children,
  commandPanel,
  header,
}: AssistantConversationShellProps) {
  return (
    <section className="h-[calc(100vh-104px)] min-h-0 w-full py-1">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-[20px] border border-[var(--skin-border)] bg-white p-4 shadow-[0_18px_48px_rgba(var(--skin-shadow-rgb),0.055)] sm:p-5">
        {header}
        <div
          ref={contentRef}
          className="min-h-0 overflow-y-auto rounded-[14px] border border-[var(--skin-border)] bg-[var(--skin-surface-soft)] px-4 py-4"
        >
          {children}
        </div>

        {commandPanel}
      </div>
    </section>
  );
}
