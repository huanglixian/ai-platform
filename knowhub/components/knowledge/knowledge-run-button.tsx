"use client";

import { notify } from "@/features/feedback/notify";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { runKnowledgeApi } from "@/knowhub/features/knowledge/api";

type KnowledgeRunButtonProps = {
  knowledgeId: string;
};

export function KnowledgeRunButton({ knowledgeId }: KnowledgeRunButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleRun() {
    setPending(true);

    try {
      await runKnowledgeApi(knowledgeId);
      router.refresh();
      notify.success("知识库构建完成");
    } catch (nextError) {
      notify.error(nextError instanceof Error ? nextError.message : "建库失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleRun} disabled={pending}>
        {pending ? "建库中..." : "重新建库"}
      </Button>
    </div>
  );
}
