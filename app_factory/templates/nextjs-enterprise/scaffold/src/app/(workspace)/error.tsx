"use client";

import { Button } from "@/components/ui/button";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-full place-items-center p-6">
      <section className="max-w-md rounded-lg border border-border bg-card p-5 text-center">
        <h1 className="text-lg font-semibold">暂时无法打开此页面</h1>
        <p className="mt-2 text-sm text-muted-foreground">请确认登录状态和当前角色权限后重试。</p>
        <Button className="mt-4" onClick={reset}>重试</Button>
      </section>
    </main>
  );
}
