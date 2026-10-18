"use client";

import { Building2, Globe2, LockKeyhole, Check } from "lucide-react";
import { useId } from "react";
import { visibilityOptions, type Visibility } from "./types";

const icons = { private: LockKeyhole, internal: Building2, all: Globe2 };
export function VisibilitySelector({
  value,
  onChange,
  disabled = false,
}: {
  value: Visibility;
  onChange: (value: Visibility) => void;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="mb-2 text-xs font-semibold text-slate-600">
        可见范围
      </legend>
      {visibilityOptions.map((option) => {
        const Icon = icons[option.value];
        const selected = option.value === value;
        return (
          <label
            key={option.value}
            className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/30 ${selected ? "border-[var(--skin-primary)] bg-[var(--skin-surface-soft)]" : "border-border hover:bg-slate-50"}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-[var(--skin-surface-accent)] text-[var(--skin-primary)]" : "bg-slate-100 text-slate-400"}`}
            >
              <Icon size={17} strokeWidth={1.7} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-title">
                {option.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">
                {option.description}
              </span>
            </span>
            <span
              className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${selected ? "border-[var(--skin-primary)] bg-[var(--skin-primary)] text-white" : "border-slate-300"}`}
            >
              {selected && <Check size={11} strokeWidth={2.5} />}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
