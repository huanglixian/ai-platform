"use client";

type ConfigEditorKind =
  | "config-file"
  | "write-allow"
  | "read-deny"
  | "soul"
  | "agents"
  | "user"
  | "memory"
  | "tools"
  | "heartbeat";

type BotConfigPanelProps = {
  workspacePath: string;
  configPath: string;
  securityListPath: string;
  writeAllowText: string;
  readDenyText: string;
  noHover?: boolean;
  onEdit: (kind: ConfigEditorKind) => void;
};

function countRules(text: string) {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function tailPath(path: string) {
  const normalized = path.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  return segments[segments.length - 1] || path || "-";
}

function ConfigRow(props: {
  title: string;
  summary: string;
  detail: string;
  onEdit: () => void;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[10px] border border-[#e8eef5] bg-white px-3 py-2.5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <div className="shrink-0 text-[12px] font-semibold text-title">{props.title}</div>
            <div className="min-w-0 truncate text-[12px] text-[#667085]">{props.summary}</div>
          </div>
          <div className="truncate text-[11px] text-[#98a2b3]">{props.detail}</div>
        </div>
        <button
          type="button"
          onClick={props.onEdit}
          className="shrink-0 rounded-[8px] border border-[#dbe5f0] px-3 py-1.5 text-[12px] font-medium text-[#356da8] transition-colors hover:border-[#bfd7f2] hover:bg-[#eef5fd]"
        >
          编辑
        </button>
      </div>
    </div>
  );
}

function FileRow(props: {
  title: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-0.5 py-1.5">
      <div className="text-[12px] font-medium text-title">{props.title}</div>
      <button
        type="button"
        onClick={props.onEdit}
        className="shrink-0 rounded-[8px] border border-[#dbe5f0] px-3 py-1.5 text-[12px] font-medium text-[#356da8] transition-colors hover:border-[#bfd7f2] hover:bg-[#eef5fd]"
      >
        编辑
      </button>
    </div>
  );
}

export function BotConfigPanel({
  workspacePath,
  configPath,
  securityListPath,
  writeAllowText,
  readDenyText,
  noHover = false,
  onEdit,
}: BotConfigPanelProps) {
  const writeCount = countRules(writeAllowText);
  const readCount = countRules(readDenyText);

  return (
    <aside
      className={[
        noHover ? "app-card-no-hover" : "app-card",
        "flex min-h-0 min-w-0 flex-col overflow-hidden",
      ].join(" ")}
    >
      <div className="border-b border-[#eef2f6] px-4 py-3">
        <div className="text-[15px] font-semibold text-title">配置区</div>
      </div>
      <div className="min-w-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="grid min-w-0 gap-3">
          <div className="min-w-0 overflow-hidden rounded-[10px] border border-[#e8eef5] bg-[#fafbfd] px-3 py-2.5">
            <div className="text-[11px] font-medium text-[#7f8ea3]">工作区路径</div>
            <div className="mt-1 break-all text-[12px] leading-5.5 text-title">
              {workspacePath || "-"}
            </div>
          </div>

          <div className="grid min-w-0 gap-2.5">
            <ConfigRow
              title="配置文件"
              summary={tailPath(configPath)}
              detail={configPath || "-"}
              onEdit={() => onEdit("config-file")}
            />
            <ConfigRow
              title="写入白名单"
              summary={writeCount ? `${writeCount} 条规则` : "暂无规则"}
              detail={securityListPath || "security_list.json"}
              onEdit={() => onEdit("write-allow")}
            />
            <ConfigRow
              title="读取黑名单"
              summary={readCount ? `${readCount} 条规则` : "暂无规则"}
              detail={securityListPath || "security_list.json"}
              onEdit={() => onEdit("read-deny")}
            />
          </div>

          <div className="border-t border-[#eef2f6]" />

          <div className="grid min-w-0 gap-2">
            <div className="px-0.5 text-[12px] font-semibold text-[#51657d]">
              自由体设置
            </div>
            <div className="grid min-w-0 gap-0 divide-y divide-[#eef2f6]">
              <FileRow title="人格设定（SOUL.md）" onEdit={() => onEdit("soul")} />
              <FileRow title="执行规则（AGENTS.md）" onEdit={() => onEdit("agents")} />
              <FileRow title="用户画像（USER.md）" onEdit={() => onEdit("user")} />
              <FileRow title="长期记忆（MEMORY.md）" onEdit={() => onEdit("memory")} />
              <FileRow title="工具说明（TOOLS.md）" onEdit={() => onEdit("tools")} />
              <FileRow title="心跳任务（HEARTBEAT.md）" onEdit={() => onEdit("heartbeat")} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export type { ConfigEditorKind };
