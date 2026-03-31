"use client";

import { useState } from "react";
import { Cloud, FolderPlus, HardDriveDownload, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const sourceOptions = [
  {
    key: "manual",
    title: "直接新建",
    description: "先建立一个空白 DocSpace，再逐步整理知识内容。",
    actionLabel: "新建空空间",
    icon: FolderPlus,
    accent: "#7a8fad",
  },
  {
    key: "ftp",
    title: "接入 FTP",
    description: "绑定 FTP 文件夹，读取目录快照并纳入统一管理。",
    actionLabel: "连接 FTP",
    icon: HardDriveDownload,
    accent: "#5c8f72",
  },
  {
    key: "oss",
    title: "接入 OSS",
    description: "绑定对象存储桶，按桶路径组织知识来源和同步范围。",
    actionLabel: "连接 OSS",
    icon: Cloud,
    accent: "#4a83c5",
  },
] as const;

type DocspaceCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DocspaceCreateDialog({
  open,
  onOpenChange,
}: DocspaceCreateDialogProps) {
  const [source, setSource] =
    useState<(typeof sourceOptions)[number]["key"]>("manual");

  const selectedOption =
    sourceOptions.find((item) => item.key === source) ?? sourceOptions[0];

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.28)] px-4 py-6 backdrop-blur-[2px]">
      <div className="w-full max-w-[560px] rounded-[18px] border border-[#d6e0eb] bg-[linear-gradient(180deg,rgba(248,250,253,0.98)_0%,rgba(255,255,255,0.98)_100%)] shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#e7edf4] px-5 py-4">
          <div>
            <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
              选择创建方式
            </div>
            <div className="mt-1 text-[13px] leading-6 text-[#667085]">
              先确定来源类型，再进入对应配置流程。
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-[10px] border border-[#dbe5f0] p-2 text-[#667085] transition-colors hover:border-[#c7d8ea] hover:text-title"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-2 px-5 py-4">
          {sourceOptions.map((item) => {
            const Icon = item.icon;
            const active = item.key === source;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSource(item.key)}
                className="rounded-[12px] border px-3.5 py-3 text-left transition-colors"
                style={{
                  borderColor: active ? `${item.accent}48` : "#dbe5f0",
                  backgroundColor: active ? `${item.accent}10` : "#ffffff",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
                    style={{
                      backgroundColor: `${item.accent}16`,
                      color: item.accent,
                    }}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-title text-[14px] font-semibold">
                      {item.title}
                    </div>
                    <div className="mt-1 text-[12px] leading-5 text-[#667085]">
                      {item.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-[#edf2f7] px-5 py-4">
          <div className="rounded-[12px] bg-[#f7fafd] px-3.5 py-3 text-[12px] leading-5 text-[#667085]">
            当前方式：
            <span className="ml-1 font-medium text-title">
              {selectedOption.title}
            </span>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {selectedOption.actionLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
