"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteDocSpaceApi } from "@/knowhub/features/docspaces/api";

type DocSpaceDeleteButtonProps = {
  id: string;
};

export function DocSpaceDeleteButton({ id }: DocSpaceDeleteButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("确定删除这个空间吗？")) {
      return;
    }

    setSubmitting(true);

    try {
      await deleteDocSpaceApi(id);
      router.push("/knowhub/docspaces");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={submitting}
      className="h-7 gap-1.5 rounded-full border-[#efc9c9] px-3 text-[12px] text-[#b54747] hover:border-[#e5a9a9] hover:bg-[#fff5f5] hover:text-[#983636]"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {submitting ? "删除中" : "删除空间"}
    </Button>
  );
}
