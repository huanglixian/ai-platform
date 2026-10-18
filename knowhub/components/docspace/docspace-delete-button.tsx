"use client";

import { notify } from "@/features/feedback/notify";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteDocSpaceApi } from "@/knowhub/features/docspace/api";

type DocSpaceDeleteButtonProps = {
  id: string;
};

export function DocSpaceDeleteButton({ id }: DocSpaceDeleteButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    if (submitting) return;

    setSubmitting(true);

    try {
      await deleteDocSpaceApi(id);
      setOpen(false);
      notify.success("文档空间已删除");
      router.push("/knowhub/docspace");
      router.refresh();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "文档空间删除失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <ConfirmDialog open={open} onOpenChange={setOpen} title="删除文档空间" description="确定删除这个文档空间吗？" pending={submitting} onConfirm={() => void handleDelete()} />
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setOpen(true)}
      disabled={submitting}
      className="h-7 gap-1.5 rounded-full border-[#efc9c9] px-3 text-[12px] text-[#b54747] hover:border-[#e5a9a9] hover:bg-[#fff5f5] hover:text-[#983636]"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {submitting ? "删除中" : "删除空间"}
    </Button>
    </>
  );
}
