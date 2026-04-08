"use client";

import { useMemo, useState } from "react";
import { Folder, FolderOpen, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DocSpaceRecord } from "@/knowhub/features/docspace/types";

type FolderTreeNode = {
  name: string;
  path: string;
  folders: FolderTreeNode[];
  files: string[];
};

type FileScopePickerDialogProps = {
  open: boolean;
  docspaceItems: DocSpaceRecord[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (docspaceId: string, path: string) => void;
};

function buildFolderTree(item: DocSpaceRecord): FolderTreeNode {
  const root: FolderTreeNode = {
    name: item.name,
    path: "/",
    folders: [],
    files: [],
  };

  item.files.forEach((file) => {
    const segments = file.path.split("/").filter(Boolean);
    const folderSegments = segments.slice(0, -1);
    let current = root;
    let currentPath = "";

    folderSegments.forEach((segment) => {
      currentPath = `${currentPath}/${segment}`;
      let nextFolder = current.folders.find((folder) => folder.name === segment);

      if (!nextFolder) {
        nextFolder = {
          name: segment,
          path: currentPath,
          folders: [],
          files: [],
        };
        current.folders.push(nextFolder);
      }

      current = nextFolder;
    });

    current.files.push(file.name);
  });

  return root;
}

function getNodeByPath(node: FolderTreeNode, targetPath: string): FolderTreeNode {
  if (node.path === targetPath) {
    return node;
  }

  for (const child of node.folders) {
    const matched = getNodeByPath(child, targetPath);

    if (matched.path === targetPath) {
      return matched;
    }
  }

  return node;
}

export function FileScopePickerDialog({
  open,
  docspaceItems,
  onOpenChange,
  onConfirm,
}: FileScopePickerDialogProps) {
  const defaultDocspaceId = docspaceItems[0]?.id ?? "";
  const [activeDocspaceId, setActiveDocspaceId] = useState(defaultDocspaceId);
  const [currentPath, setCurrentPath] = useState("/");
  const [selectedPath, setSelectedPath] = useState("/");

  const folderTrees = useMemo(
    () =>
      Object.fromEntries(
        docspaceItems.map((item) => [item.id, buildFolderTree(item)]),
      ) as Record<string, FolderTreeNode>,
    [docspaceItems],
  );

  const activeDocspace =
    docspaceItems.find((item) => item.id === activeDocspaceId) ?? docspaceItems[0];
  const activeTree = activeDocspace ? folderTrees[activeDocspace.id] : null;
  const currentNode = activeTree ? getNodeByPath(activeTree, currentPath) : null;

  function closeDialog() {
    onOpenChange(false);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.28)] px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[calc(100vh-48px)] w-full max-w-[840px] flex-col overflow-hidden rounded-[18px] border border-[#d6e0eb] bg-[linear-gradient(180deg,rgba(248,250,253,0.98)_0%,rgba(255,255,255,0.98)_100%)] shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#e7edf4] px-5 py-4">
          <div>
            <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
              新增文件夹策略
            </div>
            <div className="mt-1 text-[13px] leading-6 text-[#667085]">
              选择某个文档空间下的文件夹域，单独覆盖默认建库策略。
            </div>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="rounded-[10px] border border-[#dbe5f0] p-2 text-[#667085] transition-colors hover:border-[#c7d8ea] hover:text-title"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto px-5 py-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-[16px] border border-[#d8e1eb] bg-[#f8fbfe] p-3">
            <div className="text-[12px] font-semibold text-[#5f6f82]">选择文档空间</div>
            <div className="mt-3 flex flex-col gap-2">
              {docspaceItems.map((item) => {
                const active = item.id === activeDocspaceId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveDocspaceId(item.id);
                      setCurrentPath("/");
                      setSelectedPath("/");
                    }}
                    className="rounded-[12px] border px-3 py-3 text-left transition-colors"
                    style={{
                      borderColor: active ? "#c7d7ea" : "#d9e3ed",
                      backgroundColor: active ? "#e9f0f8" : "#ffffff",
                    }}
                  >
                    <div className="text-title text-[13px] font-medium">{item.name}</div>
                    <div className="mt-1 text-[11px] leading-5 text-[#667085]">
                      {item.documentCount} 个文件
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-[16px] border border-[#d8e1eb] bg-white p-4">
            <div className="rounded-[12px] border border-[#e7edf4] bg-[#f8fbfe] px-3 py-2 text-[12px] text-[#5f6f82]">
              当前目录：{currentPath}
            </div>

            {currentPath !== "/" ? (
              <button
                type="button"
                onClick={() => {
                  const parentPath =
                    currentPath.split("/").slice(0, -1).join("/") || "/";
                  setCurrentPath(parentPath);
                }}
                className="mt-3 text-[12px] font-medium text-[#1a4d87]"
              >
                返回上级目录
              </button>
            ) : null}

            <div className="mt-3 rounded-[14px] border border-[#e7edf4]">
              <div className="flex items-center justify-between border-b border-[#edf2f7] px-3 py-2 text-[12px] text-[#7b8798]">
                <span>可选择文件夹</span>
                <span>点击文件夹名称可继续进入</span>
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                <label className="flex items-center gap-3 border-b border-[#edf2f7] px-3 py-3 text-[13px]">
                  <input
                    type="radio"
                    name="folder-path"
                    checked={selectedPath === currentPath}
                    onChange={() => setSelectedPath(currentPath)}
                  />
                  <FolderOpen className="h-4 w-4 text-[#4a83c5]" />
                  <span className="text-title">当前目录 {currentPath}</span>
                </label>

                {currentNode?.folders.map((folder) => (
                  <div
                    key={folder.path}
                    className="flex items-center gap-3 border-b border-[#edf2f7] px-3 py-3 text-[13px]"
                  >
                    <input
                      type="radio"
                      name="folder-path"
                      checked={selectedPath === folder.path}
                      onChange={() => setSelectedPath(folder.path)}
                    />
                    <Folder className="h-4 w-4 text-[#6f96c4]" />
                    <button
                      type="button"
                      onClick={() => setCurrentPath(folder.path)}
                      className="text-left text-title hover:text-[#1a4d87]"
                    >
                      {folder.name}
                    </button>
                  </div>
                ))}

                {currentNode?.files.map((file) => (
                  <div
                    key={file}
                    className="flex items-center gap-3 px-3 py-3 text-[13px] text-[#98a2b3]"
                  >
                    <span className="w-4" />
                    <span>文件</span>
                    <span>{file}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7edf4] px-5 py-4">
          <div className="text-[12px] text-[#667085]">
            选中路径：{selectedPath} {activeDocspace ? `@ ${activeDocspace.name}` : ""}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={closeDialog}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (!activeDocspace) {
                  return;
                }

                onConfirm(activeDocspace.id, selectedPath);
                closeDialog();
              }}
            >
              确认添加
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
