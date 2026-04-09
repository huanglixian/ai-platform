"use client";

import type {
  StrategySettingDefinition,
  StrategySettingValue,
  StrategyTemplateDefinition,
} from "@/knowhub/features/strategies/types";

type StrategySettingsFormProps = {
  template: StrategyTemplateDefinition;
  values: Record<string, StrategySettingValue>;
  onChange: (nextValues: Record<string, StrategySettingValue>) => void;
};

function getNumberArrayInputValue(value: StrategySettingValue | undefined) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function renderField(
  field: StrategySettingDefinition,
  values: Record<string, StrategySettingValue>,
  onChange: (nextValue: StrategySettingValue) => void,
) {
  const value = values[field.key];

  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-3 rounded-[12px] border border-[#d9e3ed] bg-white px-3 py-3 text-[13px] text-title">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4"
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        value={typeof value === "number" ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-[10px] border border-[#cfd8e3] bg-white px-3 py-2 text-[13px] outline-none transition-colors focus:border-[#2e7dd2]"
      />
    );
  }

  if (field.type === "number-array") {
    return (
      <input
        type="text"
        value={getNumberArrayInputValue(value)}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((item) => Number(item.trim()))
              .filter((item) => Number.isInteger(item) && item > 0),
          )
        }
        placeholder="例如：1, 2, 3"
        className="w-full rounded-[10px] border border-[#cfd8e3] bg-white px-3 py-2 text-[13px] outline-none transition-colors focus:border-[#2e7dd2]"
      />
    );
  }

  return (
    <input
      type="text"
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-[10px] border border-[#cfd8e3] bg-white px-3 py-2 text-[13px] outline-none transition-colors focus:border-[#2e7dd2]"
    />
  );
}

export function StrategySettingsForm({
  template,
  values,
  onChange,
}: StrategySettingsFormProps) {
  return (
    <div className="flex flex-col gap-3">
      {template.settings.map((field) => (
        <section
          key={field.key}
          className="rounded-[14px] border border-[#dbe5ef] bg-[#f8fbfe] px-4 py-3"
        >
          <div className="text-[13px] font-medium text-title">{field.label}</div>
          <div className="mt-1 text-[12px] leading-5 text-[#667085]">{field.description}</div>
          <div className="mt-3">
            {renderField(field, values, (nextValue) =>
              onChange({
                ...values,
                [field.key]: nextValue,
              })
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
