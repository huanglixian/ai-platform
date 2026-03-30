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
    accent: "#0368b3",
  },
  {
    key: "ftp",
    title: "接入 FTP",
    description: "绑定 FTP 文件夹，读取目录快照并纳入统一管理。",
    actionLabel: "连接 FTP",
    icon: HardDriveDownload,
    accent: "#2e7dd2",
  },
  {
    key: "oss",
    title: "接入 OSS",
    description: "绑定对象存储桶，按桶路径组织知识来源和同步范围。",
    actionLabel: "连接 OSS",
    icon: Cloud,
    accent: "#1f8a57",
  },
] as const;

export function DocspaceCreateCard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [source, setSource] =
    useState<(typeof sourceOptions)[number]["key"]>("manual");

  const selectedOption =
    sourceOptions.find((item) => item.key === source) ?? sourceOptions[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="group flex min-h-[192px] h-full w-full flex-col rounded-[14px] border border-dashed border-[#b8cde3] bg-[linear-gradient(180deg,rgba(238,245,253,0.96)_0%,rgba(255,255,255,0.98)_42%,rgba(248,251,255,0.98)_100%)] px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#7fa8d3] hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#0368b3] text-white shadow-[0_8px_18px_rgba(3,104,179,0.14)]">
            <FolderPlus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-title text-[18px] font-semibold tracking-[-0.02em]">
              创建 DocSpace
            </h3>
            <div className="mt-1 text-[12px] text-[#5d7ea5]">
              选择接入方式
            </div>
          </div>
        </div>
        <div className="mt-4 flex min-w-0 flex-1 flex-col justify-between gap-3">
          <p className="text-[13px] leading-6 text-[#667085]">
            建立新的知识空间，统一接入文档来源、同步状态和后续知识沉淀。
          </p>
          <div className="w-fit rounded-[999px] border border-[#d8e5f2] bg-white/88 px-3 py-1 text-[11px] font-medium text-[#356da8]">
            点击后选择新建方式
          </div>
        </div>
      </button>

      {dialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.28)] px-4 py-6 backdrop-blur-[2px]">
          <div className="w-full max-w-[560px] rounded-[18px] border border-[#dbe5f0] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-3 border-b border-[#edf2f7] px-5 py-4">
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
                onClick={() => setDialogOpen(false)}
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
                  onClick={() => setDialogOpen(false)}
                >
                  确认方式
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
