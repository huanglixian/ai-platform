"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  StrategyPresetRecord,
  StrategySettingValue,
  StrategyTestResult,
} from "@/knowhub/features/strategies/types";

type StrategyTestPanelProps = {
  templateId: string;
  preset: StrategyPresetRecord | null;
  values: Record<string, StrategySettingValue>;
};

export function StrategyTestPanel({
  templateId,
  preset,
  values,
}: StrategyTestPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<StrategyTestResult | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function handleReset() {
    setFile(null);
    setResult(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleTest() {
    if (!file) {
      setError("请选择一个 Markdown 文件");
      return;
    }

    setPending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("templateId", templateId);
      formData.append("values", JSON.stringify(values));

      if (preset) {
        formData.append("presetId", preset.id);
      }

      formData.append("file", file);

      const response = await fetch("/api/knowhub/strategies/test", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        result?: StrategyTestResult;
      };

      if (!response.ok || !payload.ok || !payload.result) {
        throw new Error(payload.error || "策略测试失败");
      }

      setResult(payload.result);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "策略测试失败");
      setResult(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4">
      <div className="text-title text-[15px] font-semibold">测试预览</div>
      <div className="mt-1 text-[12px] leading-5 text-[#667085]">
        上传一个 Markdown 文件，直接查看切片结果。
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".md,text/markdown"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="hidden"
        />

        <div className="flex items-center gap-3 rounded-[12px] border border-[#dbe5ef] bg-[#f8fbfe] px-3 py-2.5">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => inputRef.current?.click()}
            className="shrink-0"
          >
            上传
          </Button>
          <div className="min-w-0 text-[12px] text-[#667085]">
            {file ? (
              <span className="block truncate text-title">{file.name}</span>
            ) : (
              "未选择 Markdown 文件"
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={handleTest}
            disabled={pending}
            className="col-span-2"
          >
            {pending ? "测试中..." : "开始测试"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={pending}
            className="col-span-1"
          >
            重置
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-[12px] border border-[#f0d2d2] bg-[#fff8f8] px-3 py-2 text-[12px] text-[#a33a3a]">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border border-[#dde6f0] bg-[#f8fbfe] px-3 py-2 text-[12px] text-[#5f6f82]">
            共生成 <span className="font-semibold text-title">{result.sliceCount}</span> 个切片
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {result.slices.map((slice, index) => (
              <div
                key={slice.id}
                className="rounded-[12px] border border-[#e5edf5] bg-[#fbfdff] px-3 py-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#667085]">
                  <span className="rounded-full bg-[#edf3f9] px-2 py-0.5 text-[#1a4d87]">
                    {slice.kind === "heading" ? "标题切片" : "正文切片"}
                  </span>
                  <span>#{index + 1}</span>
                  <span>
                    行号 {slice.range.startLine}-{slice.range.endLine}
                  </span>
                  <span>{slice.tokenCount} tokens</span>
                </div>
                {slice.parentHeadings.length ? (
                  <div className="mt-2 text-[11px] text-[#5f6f82]">
                    标题链：{slice.parentHeadings.map((item) => item.title).join(" / ")}
                  </div>
                ) : null}
                <pre className="mt-2 whitespace-pre-wrap break-words text-[12px] leading-6 text-title">
                  {slice.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
