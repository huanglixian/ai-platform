"use client";

import { useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { FormDialog } from "@/components/shared/form-dialog";
import { VisibilitySelector } from "@/features/access/visibility-selector";
import type { Visibility } from "@/features/access/types";
import { notify } from "@/features/feedback/notify";
import { usePublicationTaskCenter } from "./publication-task-center";

export function PublishButton({
  projectId,
  disabled,
}: {
  projectId: string;
  disabled: boolean;
}) {
  const { publish, latestForProject } = usePublicationTaskCenter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("internal");
  const [policyRevision, setPolicyRevision] = useState(0);
  const job = latestForProject(projectId);
  const active = job?.status === "queued" || job?.status === "running";
  async function configure() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/appfactory/v1/projects/${projectId}/publication`,
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error?.message || "读取发布配置失败");
      setVisibility(payload.data.access?.visibility ?? "internal");
      setPolicyRevision(payload.data.access?.revision ?? 0);
      setOpen(true);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "读取发布配置失败");
    } finally {
      setLoading(false);
    }
  }
  async function submit() {
    setSubmitting(true);
    try {
      await publish(projectId, visibility, policyRevision);
      setOpen(false);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "创建发布任务失败");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={() => void configure()}
        disabled={disabled || active || loading}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0368b3] px-3 text-xs font-medium text-white transition hover:bg-[#1a4d87] disabled:opacity-40"
      >
        {loading && <LoaderCircle size={13} className="animate-spin" />}
        {active ? "发布中…" : loading ? "读取中…" : "发布"}
      </button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="发布应用"
        description="选择发布后的可见范围。项目源码、开发对话和任务记录仍仅你可见。"
        busy={submitting}
      >
        <VisibilitySelector
          value={visibility}
          onChange={setVisibility}
          disabled={submitting}
        />
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => setOpen(false)}
            className="h-9 rounded-lg border border-border px-4 text-xs font-medium text-slate-600"
          >
            取消
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0368b3] px-4 text-xs font-medium text-white disabled:opacity-50"
          >
            {submitting ? (
              <LoaderCircle size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            {submitting ? "提交中…" : "确认发布"}
          </button>
        </div>
      </FormDialog>
    </>
  );
}
