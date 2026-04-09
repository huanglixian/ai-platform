"use client";

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
  const [error, setError] = useState("");

  async function handleRun() {
    setPending(true);
    setError("");

    try {
      await runKnowledgeApi(knowledgeId);
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "建库失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleRun} disabled={pending}>
        {pending ? "建库中..." : "重新建库"}
      </Button>
      {error ? <div className="text-[12px] text-[#a33a3a]">{error}</div> : null}
    </div>
  );
}
