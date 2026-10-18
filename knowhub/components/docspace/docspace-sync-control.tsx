"use client";

import { notify } from "@/features/feedback/notify";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { syncDocSpaceApi } from "@/knowhub/features/docspace/api";

type DocSpaceSyncControlProps = {
  id: string;
};

export function DocSpaceSyncControl({ id }: DocSpaceSyncControlProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSync() {
    setSubmitting(true);

    try {
      await syncDocSpaceApi(id);
      router.refresh();
      notify.success("文档空间已同步");
    } catch (syncError) {
      notify.error(syncError instanceof Error ? syncError.message : "同步失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        onClick={handleSync}
        disabled={submitting}
        className="h-8 gap-1.5 px-3 text-[12px]"
      >
        {submitting ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {submitting ? "同步中" : "同步"}
      </Button>
    </div>
  );
}
