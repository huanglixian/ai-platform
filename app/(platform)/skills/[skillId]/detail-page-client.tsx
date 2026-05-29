"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SkillPackage } from "@/features/skills/skill-types";

type SkillDetailPageClientProps = {
  skill: SkillPackage;
};

// 动态载入 mermaid 避免 SSR (Server-Side Rendering) 带来的 window undefined 报错
function MermaidRenderer({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState("");
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    let active = true;

    async function initAndRender() {
      try {
        const { default: mermaid } = await import("mermaid");

        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "loose",
          themeVariables: {
            primaryColor: "#eef5fd",        // 节点背景色 (淡蓝)
            primaryBorderColor: "#0368b3",  // 节点边框颜色 (平台蓝)
            primaryTextColor: "#0d0d0d",    // 节点文字颜色 (深灰)
            lineColor: "#4a83c5",           // 连接线颜色
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "12px",
            nodeRadius: "8px",
          },
          flowchart: {
            curve: "basis",                 // 优雅的贝塞尔曲线折线
            useMaxWidth: true,
            htmlLabels: true,
          },
        });

        if (!active) return;
        setRenderError("");

        // 防御性过滤，防止用户在文本框手动编辑时意外粘贴了带 Markdown 标记的 ```mermaid 块
        let cleanedChart = chart.trim();
        const blockMatch = cleanedChart.match(/```mermaid\s*([\s\S]*?)\s*```/) || cleanedChart.match(/```\s*([\s\S]*?)\s*```/);
        if (blockMatch) {
          cleanedChart = blockMatch[1].trim();
        }

        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanedChart);

        if (active) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.error("Mermaid 渲染错误：", err);
        if (active) {
          setRenderError("流程图语法无效，您可以尝试重新生成。");
        }
      }
    }

    if (chart) {
      void initAndRender();
    } else {
      setSvgContent("");
    }

    return () => {
      active = false;
    };
  }, [chart]);

  if (renderError) {
    return (
      <div className="rounded-lg border border-[#f0d2d2] bg-[#fff8f8] p-4 text-center text-[12px] text-[#a33a3a] font-sans">
        ⚠️ {renderError}
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#7f8ea3] text-[13px] font-sans">
        <span className="flex h-5 w-5 animate-spin rounded-full border-2 border-[#2474a6] border-t-transparent mb-2" />
        正在渲染流程图...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-svg-container flex justify-center py-2 overflow-auto max-w-full [&>svg]:max-w-full [&>svg]:h-auto bg-white rounded-xl border border-[#e2eaf2] p-4 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

export function SkillDetailPageClient({ skill }: SkillDetailPageClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [analyzeError, setAnalyzeError] = useState("");
  const [flowMermaid, setFlowMermaid] = useState(skill.flowMermaid || "");
  const [hasAttemptedAuto, setHasAttemptedAuto] = useState(false);

  // 自动兜底生成：当首次访问详情页且发现没有流程图时，后台自动静默拉起分析生成，防止 IDE 离线修改断档
  useEffect(() => {
    if (!flowMermaid && !analyzing && !analyzeError && !hasAttemptedAuto) {
      setHasAttemptedAuto(true);
      void handleAnalyze();
    }
  }, [flowMermaid, analyzing, analyzeError, hasAttemptedAuto]);

  // 表单状态
  const [name, setName] = useState(skill.name);
  const [description, setDescription] = useState(skill.description);
  const [category, setCategory] = useState(skill.category);
  const [enabled, setEnabled] = useState(skill.enabled);
  const [owner, setOwner] = useState(skill.owner);
  const [triggersInput, setTriggersInput] = useState(skill.triggers.join(", "));
  const [allowedToolsInput, setAllowedToolsInput] = useState((skill.allowedTools || []).join(", "));
  const [requiresSession, setRequiresSession] = useState(skill.requiresSession || false);
  const [completionToolsInput, setCompletionToolsInput] = useState((skill.completionTools || []).join(", "));
  const [skillMarkdown, setSkillMarkdown] = useState(skill.skillMarkdown);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");

    const triggers = triggersInput
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const allowedTools = allowedToolsInput
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const completionTools = completionToolsInput
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const response = await fetch(`/api/platform/skills/${skill.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          enabled,
          category,
          owner,
          triggers,
          allowedTools,
          requiresSession,
          completionTools,
          skillMarkdown,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "保存失败");
      }

      setIsEditing(false);
      router.refresh();
      
      // 保存修改成功后，前端主动再调用一次分析逻辑，将更新后的 SKILL.md 重新分析并重新渲染图
      void handleAnalyze();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "未知错误导致保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError("");

    try {
      const response = await fetch(`/api/platform/skills/${skill.id}/analyze`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "AI 分析失败");
      }

      setFlowMermaid(data.flowMermaid);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "AI 分析生成失败");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 顶部面包屑与操作栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8eef5] pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#7f8ea3]">
            <Link href="/skills" className="hover:text-[#2474a6] transition-colors">技能中心</Link>
            <span>/</span>
            <span className="text-[#4f5e71]">配置详情</span>
          </div>
          <h1 className="mt-1.5 truncate text-[20px] font-bold tracking-tight text-title">
            {skill.name} <span className="text-[13px] font-normal text-[#7f8ea3] ml-1">({skill.id})</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/skills"
            className="flex h-[34px] items-center rounded-[8px] border border-[#cbd5e1] bg-white px-3.5 text-[12px] font-semibold text-[#475569] shadow-sm transition-colors hover:bg-[#f8fafc]"
          >
            返回列表
          </Link>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex h-[34px] items-center rounded-[8px] bg-[#0368b3] px-3.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1a4d87]"
            >
              配置编辑
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setIsEditing(false);
                  setSaveError("");
                }}
                className="flex h-[34px] items-center rounded-[8px] border border-[#cbd5e1] bg-white px-3.5 text-[12px] font-semibold text-[#475569] shadow-sm transition-colors hover:bg-[#f8fafc] disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="flex h-[34px] items-center rounded-[8px] bg-[#0368b3] px-3.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1a4d87] disabled:opacity-50"
              >
                {saving ? "正在保存..." : "保存配置"}
              </button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div className="rounded-[10px] border border-[#f0d2d2] bg-[#fff8f8] px-4 py-3 text-[13px] text-[#a33a3a] font-sans shadow-sm">
          保存错误: {saveError}
        </div>
      )}

      {/* 主布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 左侧：表单及核心执行指令 */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="app-card-no-hover p-5 flex flex-col gap-4 bg-white">
            <h2 className="text-[14px] font-bold text-title border-b border-[#e8eef5] pb-2 font-sans">
              基础元配置 (Metadata)
            </h2>

            {!isEditing ? (
              // 展示模式
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] font-sans">
                <div className="flex flex-col gap-1">
                  <span className="text-[#7f8ea3] text-[11.5px] font-medium">技能名称</span>
                  <span className="text-title font-semibold">{name}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#7f8ea3] text-[11.5px] font-medium">分类归属</span>
                  <span className="text-title font-semibold">{category}</span>
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-[#7f8ea3] text-[11.5px] font-medium">一句话描述</span>
                  <span className="text-[#4f5e71] leading-relaxed">{description}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#7f8ea3] text-[11.5px] font-medium">启用状态</span>
                  <div>
                    <span
                      className={[
                        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                        enabled
                          ? "border-[#d8e8fa] bg-[#eef5fd] text-[#1a4d87]"
                          : "border-[#e2eaf2] bg-[#f4f7fa] text-[#7f8ea3]",
                      ].join(" ")}
                    >
                      {enabled ? "已启用" : "未启用"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#7f8ea3] text-[11.5px] font-medium">维护人</span>
                  <span className="text-title font-semibold">{owner}</span>
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-[#7f8ea3] text-[11.5px] font-medium">会话粘性设置 (Session sticky)</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                        requiresSession
                          ? "border-[#d8e8fa] bg-[#eef5fd] text-[#1a4d87]"
                          : "border-[#e2eaf2] bg-[#f4f7fa] text-[#7f8ea3]",
                      ].join(" ")}
                    >
                      {requiresSession ? "开启锁定" : "常规对话"}
                    </span>
                    {requiresSession && (
                      <span className="text-[11.5px] text-[#7f8ea3]">
                        完成工具：{completionToolsInput ? <code className="font-mono text-[#2474a6] bg-[#f4f7fa] px-1.5 py-0.5 rounded border border-[#e2eaf2]">{completionToolsInput}</code> : "未指定"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-[#7f8ea3] text-[11.5px] font-medium">触发句 (Triggers)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {triggersInput.split(/[,，\s]+/).filter(Boolean).map((t, idx) => (
                      <span key={idx} className="rounded-full border border-[#dbe5f0] bg-[#f7fafc] px-2.5 py-0.5 text-[11.5px] text-[#51657d]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-[#7f8ea3] text-[11.5px] font-medium">允许调用的工具列表</span>
                  <div className="flex flex-wrap gap-1.5">
                    {allowedToolsInput.split(/[,，\s]+/).filter(Boolean).length > 0 ? (
                      allowedToolsInput.split(/[,，\s]+/).filter(Boolean).map((t, idx) => (
                        <code key={idx} className="font-mono text-[11.5px] text-[#2474a6] bg-[#f4f7fa] px-2 py-0.5 rounded border border-[#e2eaf2]">
                          {t}
                        </code>
                      ))
                    ) : (
                      <span className="text-[#98a2b3] italic text-[11.5px]">无绑定外部工具</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // 编辑模式
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[#7f8ea3] text-[11.5px] font-semibold">技能名称</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-[34px] rounded-[8px] border border-[#dbe5f0] bg-white px-3 text-[#0d0d0d] outline-none transition-colors focus:border-[#6f96c4]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#7f8ea3] text-[11.5px] font-semibold">分类归属</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-[34px] rounded-[8px] border border-[#dbe5f0] bg-white px-2.5 text-[#0d0d0d] outline-none transition-colors focus:border-[#6f96c4]"
                  >
                    <option value="办公技能">办公技能</option>
                    <option value="业务技能">业务技能</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[#7f8ea3] text-[11.5px] font-semibold">一句话描述</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-[34px] rounded-[8px] border border-[#dbe5f0] bg-white px-3 text-[#0d0d0d] outline-none transition-colors focus:border-[#6f96c4]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#7f8ea3] text-[11.5px] font-semibold">启用状态</label>
                  <div className="flex items-center h-[34px]">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="rounded border-[#dbe5f0] text-[#0368b3] focus:ring-[#6f96c4]"
                      />
                      <span className="text-[#4f5e71] font-medium">启用本技能</span>
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#7f8ea3] text-[11.5px] font-semibold">维护人</label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="h-[34px] rounded-[8px] border border-[#dbe5f0] bg-white px-3 text-[#0d0d0d] outline-none transition-colors focus:border-[#6f96c4]"
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2 border-t border-[#e8eef5] pt-3">
                  <label className="text-[#7f8ea3] text-[11.5px] font-semibold">会话粘性设置 (Session sticky)</label>
                  <div className="flex flex-col gap-2 bg-[#f8fbfe] rounded-lg p-3 border border-[#e2eaf2]">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiresSession}
                        onChange={(e) => setRequiresSession(e.target.checked)}
                        className="rounded border-[#dbe5f0] text-[#0368b3] focus:ring-[#6f96c4]"
                      />
                      <span className="text-[#4f5e71] font-semibold">需要锁定会话（强推荐多步或调用工具技能开启）</span>
                    </label>
                    {requiresSession && (
                      <div className="flex flex-col gap-1 mt-1.5">
                        <label className="text-[#7f8ea3] text-[11px] font-semibold">完成工具列表 (completionTools，多个用逗号隔开)</label>
                        <input
                          type="text"
                          value={completionToolsInput}
                          onChange={(e) => setCompletionToolsInput(e.target.value)}
                          placeholder="例如: create_skill"
                          className="h-[32px] rounded-[8px] border border-[#dbe5f0] bg-white px-3 text-[#0d0d0d] outline-none transition-colors focus:border-[#6f96c4] font-mono text-[12px]"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[#7f8ea3] text-[11.5px] font-semibold">触发句 (Triggers，多个用英文/中文逗号隔开)</label>
                  <input
                    type="text"
                    value={triggersInput}
                    onChange={(e) => setTriggersInput(e.target.value)}
                    className="h-[34px] rounded-[8px] border border-[#dbe5f0] bg-white px-3 text-[#0d0d0d] outline-none transition-colors focus:border-[#6f96c4]"
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[#7f8ea3] text-[11.5px] font-semibold">允许调用的工具 (allowedTools，多个用英文/中文逗号隔开)</label>
                  <input
                    type="text"
                    value={allowedToolsInput}
                    onChange={(e) => setAllowedToolsInput(e.target.value)}
                    placeholder="例如: tower.match.search"
                    className="h-[34px] rounded-[8px] border border-[#dbe5f0] bg-white px-3 text-[#0d0d0d] outline-none transition-colors focus:border-[#6f96c4] font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="app-card-no-hover p-5 flex flex-col gap-3 bg-white">
            <h2 className="text-[14px] font-bold text-title border-b border-[#e8eef5] pb-2 font-sans">
              核心执行指令 (SKILL.md)
            </h2>

            {!isEditing ? (
              <pre className="max-h-[500px] overflow-auto rounded-lg border border-[#e2eaf2] bg-[#f8fafc] p-4 text-[12px] leading-relaxed text-[#2c3e50] whitespace-pre-wrap break-all font-mono">
                {skillMarkdown}
              </pre>
            ) : (
              <div className="flex flex-col gap-1.5 font-sans">
                <label className="text-[#7f8ea3] text-[11px] font-semibold">编排核心 Markdown 内容</label>
                <textarea
                  value={skillMarkdown}
                  onChange={(e) => setSkillMarkdown(e.target.value)}
                  className="min-h-[360px] rounded-lg border border-[#dbe5f0] bg-white px-4 py-3 text-[12.5px] leading-relaxed text-[#2c3e50] outline-none transition-colors focus:border-[#6f96c4] font-mono resize-y"
                  placeholder="# 专家角色定位\n\n## 步骤规则..."
                />
              </div>
            )}
          </div>
        </section>

        {/* 右侧：AI 流程图生成可视化区 */}
        <section className="lg:col-span-5 app-card-no-hover p-5 flex flex-col gap-4 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eef5] pb-2 font-sans">
            <h2 className="text-[14px] font-bold text-title">
              技能执行流程图
            </h2>
            <button
              type="button"
              disabled={analyzing}
              onClick={handleAnalyze}
              className="flex h-[28px] items-center rounded-[6px] bg-[#0368b3] px-3 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1a4d87] disabled:opacity-50"
            >
              {analyzing ? "分析中..." : flowMermaid ? "AI 重新分析" : "AI 智能生成"}
            </button>
          </div>

          {analyzeError && (
            <div className="rounded-[8px] border border-[#f0d2d2] bg-[#fff8f8] px-3 py-2 text-[11px] text-[#a33a3a] font-sans">
              分析失败: {analyzeError}
            </div>
          )}

          {flowMermaid ? (
            <div className="flex flex-col gap-3">
              <MermaidRenderer chart={flowMermaid} />
              
              <details className="group">
                <summary className="flex cursor-pointer select-none items-center gap-1 text-[11px] text-[#7f8ea3] hover:text-[#2474a6] list-none [&::-webkit-details-marker]:hidden font-sans font-medium">
                  <span className="transition-transform group-open:rotate-90">▸</span>
                  <span>查看流程图 Mermaid 源码</span>
                </summary>
                <pre className="mt-2 max-h-[150px] overflow-auto rounded-lg border border-[#e2eaf2] bg-[#f8fafc] p-3 text-[10px] leading-relaxed text-[#51657d] whitespace-pre-wrap font-mono">
                  {flowMermaid}
                </pre>
              </details>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#dbe5f0] rounded-xl bg-[#fafcfd] px-4">
              <span className="text-[28px] mb-2.5">📊</span>
              <h3 className="text-[13.5px] font-bold text-title font-sans">暂无执行流程图</h3>
              <p className="mt-1 text-[11.5px] text-[#7f8ea3] max-w-[240px] leading-5 font-sans">
                点击上方 “AI 智能生成” 按钮，AI 将根据该技能的执行指令自动梳理出逻辑流程图，帮助直观理解。
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
