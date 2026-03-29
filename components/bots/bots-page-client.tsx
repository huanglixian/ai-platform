"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BotCard } from "@/components/bots/bot-card";
import { CreateBotCard } from "@/components/bots/create-bot-card";
import { CardPageFrame } from "@/components/shared/card-page-frame";
import { createNanobotAgent, listNanobotAgents } from "@/features/bots/api";
import type { NanobotAgentSummary } from "@/features/bots/types";

function matchesKeyword(agent: NanobotAgentSummary, keyword: string) {
  if (!keyword) {
    return true;
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  return [
    agent.id,
    agent.name,
    agent.model_name,
    agent.workspace,
    agent.config_path,
  ].some((value) => value.toLowerCase().includes(normalizedKeyword));
}

function InfoCard({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="app-card flex min-h-[176px] flex-col justify-between p-5">
      <div>
        <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
          {title}
        </div>
        <div className="mt-2 text-[13px] leading-6 text-[#667085]">
          {description}
        </div>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 h-[34px] w-fit rounded-[8px] border border-[#dbe5f0] px-4 text-[13px] font-medium text-[#356da8] transition-colors hover:border-[#bfd7f2] hover:bg-[#eef5fd]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function BotsPageClient() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [agents, setAgents] = useState<NanobotAgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createId, setCreateId] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const filteredAgents = agents.filter((agent) => matchesKeyword(agent, keyword));

  async function loadAgents() {
    setLoading(true);
    setError("");

    try {
      const nextAgents = await listNanobotAgents();
      setAgents(nextAgents);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    const name = createName.trim();
    const agentId = createId.trim();

    if (!name) {
      setCreateError("请输入自由体名称");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const agent = await createNanobotAgent({
        name,
        agent_id: agentId || undefined,
      });
      router.push(`/bots/${encodeURIComponent(agent.id)}`);
    } catch (createAgentError) {
      setCreateError(
        createAgentError instanceof Error ? createAgentError.message : "创建失败",
      );
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    void loadAgents();
  }, []);

  return (
    <CardPageFrame
      title="自由体列表"
      count={filteredAgents.length}
      itemWidth={332}
      tabs={["全部"]}
      activeTab="全部"
      searchValue={keyword}
      searchPlaceholder="搜索自由体名称、模型或路径"
      onSearchChange={setKeyword}
    >
      <CreateBotCard
        icon="＋"
        title="创建自由体"
        description="新建独立配置和工作区，并接入 nanobot 后端运行时。"
        expanded={createOpen}
        name={createName}
        agentId={createId}
        loading={creating}
        error={createError}
        onNameChange={setCreateName}
        onAgentIdChange={setCreateId}
        onExpand={() => {
          setCreateOpen(true);
          setCreateError("");
        }}
        onCancel={() => {
          setCreateOpen(false);
          setCreateError("");
          setCreateName("");
          setCreateId("");
        }}
        onSubmit={() => void handleCreate()}
      />

      {loading ? (
        <InfoCard
          title="正在加载"
          description="正在从 nanobot_web_server 拉取真实自由体列表。"
        />
      ) : null}

      {!loading && error ? (
        <InfoCard
          title="加载失败"
          description={error}
          actionLabel="重新加载"
          onAction={() => void loadAgents()}
        />
      ) : null}

      {!loading && !error && !filteredAgents.length ? (
        <InfoCard
          title="当前没有可见自由体"
          description="可以先创建一个新的自由体，或者调整搜索关键词。"
        />
      ) : null}

      {!loading && !error
        ? filteredAgents.map((agent) => <BotCard key={agent.id} agent={agent} />)
        : null}
    </CardPageFrame>
  );
}
