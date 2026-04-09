"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EmbeddingConfigRecord } from "@/knowhub/features/settings/embedding/embedding-types";

type EmbeddingSettingsPanelProps = {
  className?: string;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "未保存";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(/\//g, "-");
}

export function EmbeddingSettingsPanel({
  className = "",
}: EmbeddingSettingsPanelProps) {
  const [values, setValues] = useState<EmbeddingConfigRecord>({
    baseUrl: "",
    apiKey: "",
    model: "",
    updatedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/knowhub/settings/embedding", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
          item?: EmbeddingConfigRecord;
        };

        if (!response.ok || !payload.ok || !payload.item) {
          throw new Error(payload.error || "加载 embedding 配置失败");
        }

        if (cancelled) {
          return;
        }

        setValues(payload.item);
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "加载 embedding 配置失败");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    setStatus("");

    try {
      const response = await fetch("/api/knowhub/settings/embedding", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseUrl: values.baseUrl,
          apiKey: values.apiKey,
          model: values.model,
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        item?: EmbeddingConfigRecord;
      };

      if (!response.ok || !payload.ok || !payload.item) {
        throw new Error(payload.error || "保存 embedding 配置失败");
      }

      setValues(payload.item);
      setStatus("embedding 配置已保存");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "保存 embedding 配置失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className={`rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4 ${className}`.trim()}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-title text-[15px] font-semibold">Embedding 配置</div>
          <div className="mt-1 text-[12px] leading-5 text-[#667085]">
            这里配置知识库建库和检索使用的向量化接口。Platform 只调用 KnowHub
            检索 API，不直接感知这套配置。
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading || saving}>
          {saving ? "保存中..." : "保存 Embedding 配置"}
        </Button>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <div>
          <div className="mb-1 text-[12px] text-[#5f6f82]">Base URL</div>
          <Input
            value={values.baseUrl}
            onChange={(event) =>
              setValues((current) => ({ ...current, baseUrl: event.target.value }))
            }
            placeholder="例如：https://api.openai.com/v1"
            disabled={loading}
          />
        </div>
        <div>
          <div className="mb-1 text-[12px] text-[#5f6f82]">API Key</div>
          <Input
            type="password"
            value={values.apiKey}
            onChange={(event) =>
              setValues((current) => ({ ...current, apiKey: event.target.value }))
            }
            placeholder="输入向量化接口凭证"
            disabled={loading}
          />
        </div>
        <div>
          <div className="mb-1 text-[12px] text-[#5f6f82]">模型名称</div>
          <Input
            value={values.model}
            onChange={(event) =>
              setValues((current) => ({ ...current, model: event.target.value }))
            }
            placeholder="例如：text-embedding-3-small"
            disabled={loading}
          />
        </div>
      </div>

      <div className="mt-3 text-[11px] text-[#7b8798]">
        最近保存：{formatDateTime(values.updatedAt)}
      </div>

      {error ? (
        <div className="mt-3 rounded-[12px] border border-[#f0d2d2] bg-[#fff8f8] px-3 py-2 text-[12px] text-[#a33a3a]">
          {error}
        </div>
      ) : null}

      {status ? (
        <div className="mt-3 rounded-[12px] border border-[#dbe5ef] bg-[#f8fbfe] px-3 py-2 text-[12px] text-[#5f6f82]">
          {status}
        </div>
      ) : null}
    </section>
  );
}
