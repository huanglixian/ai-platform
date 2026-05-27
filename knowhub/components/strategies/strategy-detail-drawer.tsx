"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StrategySettingsForm } from "@/knowhub/components/strategies/strategy-settings-form";
import { StrategyTestPanel } from "@/knowhub/components/strategies/strategy-test-panel";
import type {
  StrategyPresetRecord,
  StrategyRecord,
  StrategySettingValue,
  StrategyTemplateDefinition,
} from "@/knowhub/features/strategies/types";

type StrategyDetailDrawerProps = {
  item: StrategyRecord | null;
  template: StrategyTemplateDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function StrategyDetailDrawer({
  item,
  template,
  open,
  onOpenChange,
}: StrategyDetailDrawerProps) {
  const [presets, setPresets] = useState<StrategyPresetRecord[]>([]);
  const [presetId, setPresetId] = useState("");
  const [presetName, setPresetName] = useState("");
  const [values, setValues] = useState<Record<string, StrategySettingValue>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [presetExpanded, setPresetExpanded] = useState(false);

  const currentPreset = useMemo(
    () => presets.find((preset) => preset.id === presetId) ?? null,
    [presetId, presets],
  );

  useEffect(() => {
    if (!open || !template) {
      return;
    }

    let cancelled = false;
    const templateId = template.id;

    async function loadPresets() {
      setError("");

      try {
        const response = await fetch(
          `/api/knowhub/strategies/presets?templateId=${encodeURIComponent(templateId)}`,
        );
        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
          items?: StrategyPresetRecord[];
        };

        if (!response.ok || !payload.ok || !payload.items) {
          throw new Error(payload.error || "加载预设失败");
        }

        if (cancelled) {
          return;
        }

        setPresets(payload.items);
        setPresetId(payload.items[0]?.id ?? "");
        setPresetName(payload.items[0]?.name ?? "");
        setValues(payload.items[0]?.values ?? {});
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "加载预设失败");
      }
    }

    void loadPresets();

    return () => {
      cancelled = true;
    };
  }, [open, template]);

  useEffect(() => {
    if (!currentPreset) {
      return;
    }

    setPresetName(currentPreset.name);
    setValues(currentPreset.values);
  }, [currentPreset]);

  if (!open || !item) {
    return null;
  }

  async function handleSavePreset() {
    if (!template) {
      return;
    }

    setPending(true);
    setError("");

    try {
      const isReadonlyPreset = currentPreset?.readonly ?? true;
      const targetPresetId = !isReadonlyPreset ? currentPreset?.id : "";
      const response = await fetch(
        targetPresetId
          ? `/api/knowhub/strategies/presets/${encodeURIComponent(targetPresetId)}`
          : "/api/knowhub/strategies/presets",
        {
          method: targetPresetId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            targetPresetId
              ? {
                  name: presetName.trim(),
                  values,
                }
              : {
                  templateId: template.id,
                  name: presetName.trim(),
                  values,
                },
          ),
        },
      );
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        item?: StrategyPresetRecord;
      };

      if (!response.ok || !payload.ok || !payload.item) {
        throw new Error(payload.error || "保存预设失败");
      }

      const savedPreset = payload.item;
      setPresets((current) => {
        const exists = current.some((preset) => preset.id === savedPreset.id);

        if (exists) {
          return current.map((preset) =>
            preset.id === savedPreset.id ? savedPreset : preset,
          );
        }

        return [...current, savedPreset];
      });
      setPresetId(savedPreset.id);
      setPresetName(savedPreset.name);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "保存预设失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(15,23,42,0.28)] backdrop-blur-[2px]">
      <div className="flex h-full w-full max-w-[1080px] flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(248,250,253,0.98)_0%,rgba(255,255,255,0.98)_100%)] shadow-[-24px_0_64px_rgba(15,23,42,0.16)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#e7edf4] px-5 py-4">
          <div>
            <div className="text-title text-[20px] font-semibold tracking-[-0.03em]">
              {item.name}
            </div>
            <div className="mt-1 text-[13px] leading-6 text-[#667085]">{item.summary}</div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-[10px] border border-[#dbe5f0] p-2 text-[#667085] transition-colors hover:border-[#c7d8ea] hover:text-title"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!template ? (
          <div className="px-5 py-6">
            <div className="rounded-[16px] border border-[#d8e1eb] bg-white px-5 py-5">
              <div className="text-title text-[15px] font-semibold">暂未接入真实模板</div>
              <div className="mt-2 text-[13px] leading-6 text-[#667085]">
                当前策略仍是展示数据，尚未接入参数预设和测试能力。
              </div>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 gap-4 overflow-y-auto px-5 py-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="space-y-4">
              <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4">
                <div className="text-title text-[15px] font-semibold">参数设置</div>
                <div className="mt-1 text-[12px] leading-5 text-[#667085]">
                  先调整当前参数，确认效果后再决定是否另存为预设。
                </div>
                <div className="mt-4">
                  <StrategySettingsForm
                    template={template}
                    values={values}
                    onChange={setValues}
                  />
                </div>
              </section>

              <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4">
                <button
                  type="button"
                  onClick={() => setPresetExpanded((current) => !current)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div>
                    <div className="text-title text-[15px] font-semibold">高级：预设管理</div>
                    <div className="mt-1 text-[12px] leading-5 text-[#667085]">
                      当前预设：{currentPreset?.name || "默认预设"}
                    </div>
                  </div>
                  {presetExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[#667085]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#667085]" />
                  )}
                </button>

                {presetExpanded ? (
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-1 text-[12px] text-[#5f6f82]">选择预设</div>
                      <select
                        value={presetId}
                        onChange={(event) => setPresetId(event.target.value)}
                        className="w-full rounded-[10px] border border-[#cfd8e3] bg-white px-3 py-2 text-[13px] outline-none transition-colors focus:border-[#2e7dd2]"
                      >
                        {presets.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="mb-1 text-[12px] text-[#5f6f82]">预设名称</div>
                      <Input
                        value={presetName}
                        onChange={(event) => setPresetName(event.target.value)}
                        placeholder="例如：三级标题切片"
                      />
                    </div>

                    <Button onClick={handleSavePreset} disabled={pending}>
                      {pending ? "保存中..." : "保存预设"}
                    </Button>
                  </div>
                ) : null}
              </section>

              {error ? (
                <div className="rounded-[14px] border border-[#f0d2d2] bg-[#fff8f8] px-4 py-3 text-[13px] text-[#a33a3a]">
                  {error}
                </div>
              ) : null}
            </section>

            <StrategyTestPanel
              templateId={template.id}
              preset={currentPreset}
              values={values}
            />
          </div>
        )}
      </div>
    </div>
  );
}
