"use client";

import { useState } from "react";

type AssistantComposerProps = {
  value: string;
  placeholder: string;
  sending: boolean;
  status: string;
  submitLabel: string;
  sendingLabel: string;
  error?: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void | Promise<void>;
};

export function AssistantComposer({
  value,
  placeholder,
  sending,
  status,
  submitLabel,
  sendingLabel,
  error = "",
  onChange,
  onSubmit,
}: AssistantComposerProps) {
  const [isComposing, setIsComposing] = useState(false);

  function submit() {
    if (sending) {
      return;
    }

    void onSubmit(value);
  }

  return (
    <section className="app-card-no-hover overflow-hidden">
      <div className="grid gap-3 px-4 py-4">
        {error ? (
          <div className="rounded-[10px] border border-[#f0d2d2] bg-[#fff8f8] px-3 py-2 text-[12px] text-[#a33a3a]">
            {error}
          </div>
        ) : null}

        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !isComposing &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="min-h-[88px] resize-none rounded-[12px] border border-[#e9ddda] bg-white px-4 py-3 text-[13px] leading-6 text-title outline-none transition-colors placeholder:text-[#98a2b3] focus:border-[#ad5964]"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 truncate text-[12px] text-[#a08d85]">{status}</div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={sending}
              onClick={submit}
              className="h-[36px] rounded-[8px] bg-[#922c3b] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#70202e] disabled:cursor-not-allowed disabled:bg-[#c99499]"
            >
              {sending ? sendingLabel : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
