"use client";

import React from "react";
import { WorkflowNode } from "@/features/workflows/types";

interface Props {
  node: WorkflowNode | null;
  onClose: () => void;
  onUpdate: (updatedNode: WorkflowNode) => void;
}

export function NodePropertiesPanel({ node, onClose, onUpdate }: Props) {
  if (!node) return null;

  // 防御性设计：防范 data 或 config 未完全初始化时报错
  const data = node.data || { label: "", description: "", config: {} };
  const config = data.config || {};

  function handleFieldChange(field: string, val: string) {
    if (!node) return;
    onUpdate({
      ...node,
      data: {
        ...data,
        [field]: val
      }
    });
  }

  function handleConfigChange(key: string, val: string) {
    if (!node) return;
    onUpdate({
      ...node,
      data: {
        ...data,
        config: {
          ...config,
          [key]: val
        }
      }
    });
  }

  return (
    <div className="w-[340px] border-l border-border bg-white shadow-xl flex flex-col h-full animate-in slide-in-from-right duration-250 font-sans">
      <div className="flex items-center justify-between border-b border-border px-4 py-4.5 bg-slate-50/50">
        <div>
          <h3 className="text-xs font-bold text-title flex items-center gap-1.5">
            <span>⚙️</span> 配置节点
          </h3>
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wide">
            类型: {node.type}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-xs p-1 rounded-md hover:bg-slate-100"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500">节点名称</label>
          <input
            type="text"
            value={data.label || ""}
            onChange={(e) => handleFieldChange("label", e.target.value)}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500">描述</label>
          <textarea
            value={data.description || ""}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
          <h4 className="text-[11px] font-bold text-title">特有配置</h4>

          {node.type === "start" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold">Prompt 提示词模板</label>
              <textarea
                value={config.prompt || ""}
                onChange={(e) => handleConfigChange("prompt", e.target.value)}
                className="w-full min-h-[100px] rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors resize-y font-mono"
                placeholder="可在此定义起始的提示词结构"
              />
            </div>
          )}

          {node.type === "model" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-500 font-semibold">模型提供商</label>
                <select
                  value={config.modelName || "DeepSeek-V4"}
                  onChange={(e) => handleConfigChange("modelName", e.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="DeepSeek-V4">DeepSeek-V4 (推荐)</option>
                  <option value="DeepSeek-R1">DeepSeek-R1</option>
                  <option value="GPT-4o">GPT-4o</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-500 font-semibold">系统提示词 (System Prompt)</label>
                <textarea
                  value={config.prompt || ""}
                  onChange={(e) => handleConfigChange("prompt", e.target.value)}
                  className="w-full min-h-[100px] rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors resize-y font-mono"
                />
              </div>
            </div>
          )}

          {node.type === "tool" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold">选择关联工具</label>
              <select
                value={config.toolId || ""}
                onChange={(e) => handleConfigChange("toolId", e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
              >
                <option value="">-- 请选择 --</option>
                <option value="calculator">计算器</option>
                <option value="weather">天气查询</option>
              </select>
            </div>
          )}

          {node.type === "service" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold">选择业务 API 服务</label>
              <select
                value={config.serviceId || ""}
                onChange={(e) => handleConfigChange("serviceId", e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
              >
                <option value="">-- 请选择 --</option>
                <option value="tower-match">杆塔自动匹配接口</option>
                <option value="image-ocr">图像 OCR 分析服务</option>
              </select>
            </div>
          )}

          {node.type === "skill" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold">选择导入的技能</label>
              <select
                value={config.skillId || ""}
                onChange={(e) => handleConfigChange("skillId", e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
              >
                <option value="">-- 请选择 --</option>
                <option value="safety-expert">安全诊断专家</option>
                <option value="trans-translator">外文文档翻译</option>
              </select>
            </div>
          )}

          {node.type === "code" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold">代码块内容 (Python/JavaScript)</label>
              <textarea
                value={config.codeContent || ""}
                onChange={(e) => handleConfigChange("codeContent", e.target.value)}
                className="w-full min-h-[140px] rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors resize-y font-mono"
                placeholder="// 在此编写自定义脚本..."
              />
            </div>
          )}

          {node.type === "condition" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold">条件表达式</label>
              <input
                type="text"
                value={config.conditionExpr || ""}
                onChange={(e) => handleConfigChange("conditionExpr", e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors font-mono"
                placeholder="例如: score > 0.8"
              />
            </div>
          )}

          {node.type === "knowhub" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold">选择关联知识库</label>
              <select
                value={config.knowledgeBaseId || ""}
                onChange={(e) => handleConfigChange("knowledgeBaseId", e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
              >
                <option value="">-- 请选择知识库 --</option>
                <option value="safety-rules">电力系统安全规程知识库</option>
                <option value="tower-specs">输电杆塔技术规范说明书</option>
              </select>
            </div>
          )}

          {node.type === "end" && (
            <span className="text-xs text-slate-400 italic">结束节点无须额外配置。</span>
          )}
        </div>
      </div>
    </div>
  );
}
