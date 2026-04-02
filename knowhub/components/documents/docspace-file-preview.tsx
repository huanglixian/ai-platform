"use client";

import { useMemo, useState } from "react";
import { ChevronRight, FileText, Folder } from "lucide-react";

import type { DocSpaceRecord } from "@/knowhub/features/docspaces/types";

type DocspaceFilePreviewProps = {
  item: DocSpaceRecord | null;
};

type DirectoryEntry = {
  name: string;
  path: string;
};

type FileDirectoryMap = Map<
  string,
  {
    directories: DirectoryEntry[];
    files: DocSpaceRecord["files"];
  }
>;

function normalizeDirectoryPath(pathname: string) {
  const normalized = pathname.replace(/\/+/g, "/").replace(/\/$/, "");
  return normalized || "/";
}

function getParentDirectory(pathname: string) {
  if (pathname === "/") {
    return "/";
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return "/";
  }

  return `/${segments.slice(0, -1).join("/")}`;
}

function buildDirectoryMap(files: DocSpaceRecord["files"]): FileDirectoryMap {
  const directoryMap: FileDirectoryMap = new Map();

  function ensureDirectory(pathname: string) {
    const normalized = normalizeDirectoryPath(pathname);

    if (!directoryMap.has(normalized)) {
      directoryMap.set(normalized, {
        directories: [],
        files: [],
      });
    }

    return directoryMap.get(normalized)!;
  }

  ensureDirectory("/");

  for (const file of files) {
    const segments = file.path.split("/").filter(Boolean);
    const fileName = segments[segments.length - 1];
    const folderSegments = segments.slice(0, -1);
    const currentDirectory =
      folderSegments.length > 0 ? `/${folderSegments.join("/")}` : "/";

    ensureDirectory(currentDirectory).files.push(file);

    let builtPath = "";

    for (const folderName of folderSegments) {
      const parentPath = builtPath ? `/${builtPath}` : "/";
      builtPath = builtPath ? `${builtPath}/${folderName}` : folderName;
      const directoryPath = `/${builtPath}`;
      const parentDirectory = ensureDirectory(parentPath);

      if (!parentDirectory.directories.some((entry) => entry.path === directoryPath)) {
        parentDirectory.directories.push({
          name: folderName,
          path: directoryPath,
        });
      }

      ensureDirectory(directoryPath);
    }

    if (!fileName) {
      continue;
    }
  }

  for (const value of directoryMap.values()) {
    value.directories.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
    value.files.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  }

  return directoryMap;
}

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const items = [
    {
      label: "根目录",
      path: "/",
    },
  ];

  let currentPath = "";

  for (const segment of segments) {
    currentPath = `${currentPath}/${segment}`;
    items.push({
      label: segment,
      path: currentPath,
    });
  }

  return items;
}

export function DocspaceFilePreview({ item }: DocspaceFilePreviewProps) {
  const directoryMap = useMemo(
    () => buildDirectoryMap(item?.files || []),
    [item?.files],
  );
  const [currentPath, setCurrentPath] = useState("/");

  if (!item || !item.files.length) {
    return null;
  }

  const resolvedPath = directoryMap.has(currentPath) ? currentPath : "/";
  const currentDirectory = directoryMap.get(resolvedPath);

  if (!currentDirectory) {
    return null;
  }

  const breadcrumbs = buildBreadcrumbs(resolvedPath);
  const parentPath = getParentDirectory(resolvedPath);

  return (
    <section className="rounded-[14px] border border-[#d8e1eb] bg-[linear-gradient(180deg,rgba(249,251,253,0.98)_0%,rgba(255,255,255,0.98)_100%)] px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-title text-[15px] font-semibold">文件列表</div>
            {resolvedPath !== "/" ? (
              <button
                type="button"
                onClick={() => setCurrentPath(parentPath)}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#dbe5f0] bg-white px-3 py-1.5 text-[12px] text-[#5f6f82] transition-colors hover:border-[#c7d8ea] hover:text-title"
              >
                返回上一级
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1 text-[12px] text-[#667085]">
            {breadcrumbs.map((crumb, index) => (
              <button
                key={crumb.path}
                type="button"
                onClick={() => setCurrentPath(crumb.path)}
                className="inline-flex items-center gap-1 rounded-[8px] px-2 py-1 transition-colors hover:bg-[#eef5fd] hover:text-title"
              >
                {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-[#98a2b3]" /> : null}
                <span>{crumb.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[12px] border border-[#e2eaf2] bg-[rgba(255,255,255,0.88)] px-3 py-3">
          <div className="grid grid-cols-[minmax(0,1.4fr)_90px_120px_90px] gap-3 px-3 py-2 text-[11px] font-medium text-[#8d98a8]">
            <div>名称</div>
            <div>大小</div>
            <div>更新时间</div>
            <div>状态</div>
          </div>

          <div className="space-y-2">
            {currentDirectory.directories.map((directory) => (
              <button
                key={directory.path}
                type="button"
                onClick={() => setCurrentPath(directory.path)}
                className="grid w-full grid-cols-[minmax(0,1.4fr)_90px_120px_90px] gap-3 rounded-[10px] border border-[#edf2f7] bg-[#f7fbff] px-3 py-2 text-left text-[12px] transition-colors hover:border-[#d7e5f3] hover:bg-[#eef6fd]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Folder className="h-4 w-4 shrink-0 text-[#5f7ea5]" />
                  <span className="truncate font-medium text-title">{directory.name}</span>
                </div>
                <div className="text-[#98a2b3]">-</div>
                <div className="text-[#98a2b3]">-</div>
                <div className="text-[#5f7ea5]">文件夹</div>
              </button>
            ))}

            {currentDirectory.files.map((file) => (
              <div
                key={file.id}
                className="grid grid-cols-[minmax(0,1.4fr)_90px_120px_90px] gap-3 rounded-[10px] border border-[#edf2f7] bg-white px-3 py-2 text-[12px]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-[#7b8798]" />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-title">{file.name}</div>
                    <div className="truncate text-[11px] text-[#98a2b3]">{file.path}</div>
                  </div>
                </div>
                <div className="text-[#667085]">{file.sizeLabel}</div>
                <div className="text-[#667085]">{file.updatedAt}</div>
                <div className="text-[#1a4d87]">{file.statusLabel}</div>
              </div>
            ))}

            {!currentDirectory.directories.length && !currentDirectory.files.length ? (
              <div className="rounded-[10px] border border-dashed border-[#dbe5f0] px-3 py-6 text-center text-[12px] text-[#98a2b3]">
                当前目录下没有内容
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
