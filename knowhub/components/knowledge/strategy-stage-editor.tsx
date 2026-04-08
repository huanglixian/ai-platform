"use client";

import type { KnowledgeFileTypeDraft } from "@/knowhub/features/knowledge/builder-types";

type StrategyStageEditorProps = {
  value: KnowledgeFileTypeDraft;
  onChange: (nextValue: KnowledgeFileTypeDraft) => void;
};

export function StrategyStageEditor({
  value,
  onChange,
}: StrategyStageEditorProps) {
  function updateItem(
    stageIndex: number,
    itemIndex: number,
    recipe: (currentEnabled: boolean) => boolean,
  ) {
    const nextValue: KnowledgeFileTypeDraft = {
      ...value,
      stages: value.stages.map((stage, currentStageIndex) => {
        if (currentStageIndex !== stageIndex) {
          return stage;
        }

        return {
          ...stage,
          items: stage.items.map((item, currentItemIndex) => {
            if (currentItemIndex !== itemIndex) {
              return item;
            }

            return {
              ...item,
              enabled: recipe(item.enabled),
            };
          }),
        };
      }),
    };

    onChange(nextValue);
  }

  function moveItem(stageIndex: number, itemIndex: number, direction: -1 | 1) {
    const nextIndex = itemIndex + direction;
    const stage = value.stages[stageIndex];

    if (!stage || nextIndex < 0 || nextIndex >= stage.items.length) {
      return;
    }

    const nextItems = [...stage.items];
    const [movedItem] = nextItems.splice(itemIndex, 1);
    nextItems.splice(nextIndex, 0, movedItem);

    onChange({
      ...value,
      stages: value.stages.map((currentStage, currentStageIndex) =>
        currentStageIndex === stageIndex
          ? {
              ...currentStage,
              items: nextItems,
            }
          : currentStage,
      ),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {value.stages.map((stage, stageIndex) => (
        <section key={stage.key} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 px-1">
            <div className="text-title text-[12px] font-semibold tracking-[0.02em]">
              {stage.label}
            </div>
            <div className="h-px flex-1 bg-[#e5edf5]" />
          </div>

          <div className="flex flex-col gap-1.5">
            {stage.items.map((item, itemIndex) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-[10px] border border-[#edf2f7] px-2.5 py-2 transition-colors"
                style={{
                  backgroundColor: item.enabled ? "#ffffff" : "#f7f9fc",
                  opacity: item.enabled ? 1 : 0.68,
                }}
              >
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={() =>
                    updateItem(stageIndex, itemIndex, (currentEnabled) => !currentEnabled)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-[#c7d6e6]"
                />

                <div className="min-w-0 flex-1">
                  <div className="text-title text-[13px] font-medium">{item.name}</div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(stageIndex, itemIndex, -1)}
                    disabled={itemIndex === 0}
                    className="rounded-[8px] border border-[#d8e1eb] bg-white px-2 py-1 text-[11px] text-[#5f6f82] disabled:opacity-40"
                  >
                    上移
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(stageIndex, itemIndex, 1)}
                    disabled={itemIndex === stage.items.length - 1}
                    className="rounded-[8px] border border-[#d8e1eb] bg-white px-2 py-1 text-[11px] text-[#5f6f82] disabled:opacity-40"
                  >
                    下移
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
