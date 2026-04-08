"use client";

import { useRef, useState } from "react";
import { FilePlus2, LoaderCircle, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { uploadDocSpaceFilesApi } from "@/knowhub/features/docspaces/api";

type DocSpaceUploadControlProps = {
  id: string;
  variant?: "button" | "empty";
};

export function DocSpaceUploadControl({
  id,
  variant = "button",
}: DocSpaceUploadControlProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  async function submitFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);

    if (!files.length) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      await uploadDocSpaceFilesApi(id, files);
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败");
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  if (variant === "empty") {
    return (
      <div className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) {
              void submitFiles(event.target.files);
            }
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void submitFiles(event.dataTransfer.files);
          }}
          className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-[16px] border border-dashed px-6 py-8 text-center transition-colors"
          style={{
            borderColor: dragging ? "#9eb8d5" : "#d8e1eb",
            backgroundColor: dragging ? "#f3f8fd" : "#fbfdff",
          }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#edf4fb] text-[#5f7ea5]">
            {uploading ? (
              <LoaderCircle className="h-6 w-6 animate-spin" />
            ) : (
              <UploadCloud className="h-6 w-6" />
            )}
          </div>
          <div className="mt-4 text-title text-[16px] font-semibold">
            {uploading ? "正在上传文件..." : "拖拽文件到这里，或点击上传"}
          </div>
          <div className="mt-2 text-[12px] leading-6 text-[#667085]">
            仅支持本地空间上传，可一次选择多个文件。
          </div>
        </button>
        {error ? <div className="text-[12px] text-[#b54747]">{error}</div> : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            void submitFiles(event.target.files);
          }
        }}
      />
      <Button
        type="button"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="h-8 gap-1.5 px-3 text-[12px]"
      >
        {uploading ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FilePlus2 className="h-3.5 w-3.5" />
        )}
        {uploading ? "上传中" : "上传文件"}
      </Button>
      {error ? <div className="text-[12px] text-[#b54747]">{error}</div> : null}
    </div>
  );
}
