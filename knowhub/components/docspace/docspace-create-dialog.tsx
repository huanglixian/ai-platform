"use client";

import { useState } from "react";
import { Cloud, FolderPlus, HardDriveDownload, LoaderCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDocSpaceApi,
  testDocSpaceConnectionApi,
} from "@/knowhub/features/docspace/api";
import type { DocSpaceRecord } from "@/knowhub/features/docspace/types";

const sourceOptions = [
  {
    key: "hosted",
    title: "本地空间",
    description: "在当前服务器环境中创建平台托管空间。",
    actionLabel: "创建空间",
    icon: FolderPlus,
    accent: "#7a8fad",
  },
  {
    key: "smb",
    title: "接入 SMB",
    description: "绑定共享目录，读取目录快照并纳入统一管理。",
    actionLabel: "连接 SMB",
    icon: HardDriveDownload,
    accent: "#5c8f72",
  },
  {
    key: "oss",
    title: "接入 OSS",
    description: "绑定对象存储桶，按桶路径组织知识来源和同步范围。",
    actionLabel: "连接 OSS",
    icon: Cloud,
    accent: "#4a83c5",
  },
] as const;

type DocSpaceCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (item: DocSpaceRecord) => void;
};

export function DocSpaceCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: DocSpaceCreateDialogProps) {
  const [source, setSource] =
    useState<(typeof sourceOptions)[number]["key"]>("hosted");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [bucket, setBucket] = useState("");
  const [region, setRegion] = useState("");
  const [prefix, setPrefix] = useState("");
  const [accessKeyId, setAccessKeyId] = useState("");
  const [accessKeySecret, setAccessKeySecret] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("445");
  const [shareName, setShareName] = useState("");
  const [basePath, setBasePath] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [domain, setDomain] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [testMessage, setTestMessage] = useState("");

  const selectedOption =
    sourceOptions.find((item) => item.key === source) ?? sourceOptions[0];

  function resetForm() {
    setName("");
    setSummary("");
    setEndpoint("");
    setBucket("");
    setRegion("");
    setPrefix("");
    setAccessKeyId("");
    setAccessKeySecret("");
    setHost("");
    setPort("445");
    setShareName("");
    setBasePath("");
    setUsername("");
    setPassword("");
    setDomain("");
    setError("");
    setTestMessage("");
  }

  function buildPayload() {
    const trimmedName = name.trim();
    const trimmedSummary = summary.trim();

    if (!trimmedName) {
      throw new Error("请输入空间名称");
    }

    if (source === "hosted") {
      return {
        name: trimmedName,
        summary: trimmedSummary,
        source: {
          type: "hosted" as const,
        },
      };
    }

    if (source === "oss") {
      return {
        name: trimmedName,
        summary: trimmedSummary,
        source: {
          type: "oss" as const,
          endpoint: endpoint.trim(),
          bucket: bucket.trim(),
          region: region.trim(),
          accessKeyId: accessKeyId.trim(),
          accessKeySecret: accessKeySecret.trim(),
          prefix: prefix.trim(),
        },
      };
    }

    return {
      name: trimmedName,
      summary: trimmedSummary,
      source: {
        type: "smb" as const,
        host: host.trim(),
        port: Number(port || 445),
        shareName: shareName.trim(),
        basePath: basePath.trim(),
        username: username.trim(),
        password: password.trim(),
        domain: domain.trim() || undefined,
      },
    };
  }

  async function handleTestConnection() {
    if (source === "hosted") {
      setTestMessage("平台托管空间无需测试连接。");
      setError("");
      return;
    }

    setTesting(true);
    setError("");
    setTestMessage("");

    try {
      const payload = buildPayload();
      let result = null;

      if (payload.source.type === "oss") {
        result = await testDocSpaceConnectionApi({
          source: payload.source,
        });
      } else if (payload.source.type === "smb") {
        result = await testDocSpaceConnectionApi({
          source: payload.source,
        });
      }

      if (!result) {
        throw new Error("当前方式无需测试连接");
      }

      setTestMessage(result.message);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "测试连接失败");
    } finally {
      setTesting(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const payload = buildPayload();
      const item = await createDocSpaceApi(payload);
      onCreated(item);
      onOpenChange(false);
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.28)] px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[calc(100vh-48px)] w-full max-w-[560px] flex-col overflow-hidden rounded-[18px] border border-[#d6e0eb] bg-[linear-gradient(180deg,rgba(248,250,253,0.98)_0%,rgba(255,255,255,0.98)_100%)] shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#e7edf4] px-5 py-4">
          <div>
            <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
              选择创建方式
            </div>
            <div className="mt-1 text-[13px] leading-6 text-[#667085]">
              先确定来源类型，再进入对应配置流程。
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            className="rounded-[10px] border border-[#dbe5f0] p-2 text-[#667085] transition-colors hover:border-[#c7d8ea] hover:text-title"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            {sourceOptions.map((item) => {
              const Icon = item.icon;
              const active = item.key === source;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSource(item.key);
                    setError("");
                    setTestMessage("");
                  }}
                  className="rounded-[12px] border px-3 py-3 text-center transition-colors"
                  style={{
                    borderColor: active ? `${item.accent}48` : "#dbe5f0",
                    backgroundColor: active ? `${item.accent}10` : "#ffffff",
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-[11px]"
                      style={{
                        backgroundColor: `${item.accent}16`,
                        color: item.accent,
                      }}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-title text-[13px] font-semibold">
                      {item.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-[12px] font-medium text-[#5f6f82]">空间名称</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：协议材料空间" />
            </label>

            <label className="grid gap-1">
              <span className="text-[12px] font-medium text-[#5f6f82]">空间描述</span>
              <Input value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="补充这个空间接入的资料范围和用途" />
            </label>

            {source === "oss" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-[12px] font-medium text-[#5f6f82]">访问密钥 ID</span>
                  <Input value={accessKeyId} onChange={(event) => setAccessKeyId(event.target.value)} placeholder="请输入访问密钥 ID" />
                </label>
                <label className="grid gap-1">
                  <span className="text-[12px] font-medium text-[#5f6f82]">访问密钥 Secret</span>
                  <Input type="password" value={accessKeySecret} onChange={(event) => setAccessKeySecret(event.target.value)} placeholder="请输入访问密钥 Secret" />
                </label>
                <label className="grid gap-1">
                  <span className="text-[12px] font-medium text-[#5f6f82]">存储桶</span>
                  <Input value={bucket} onChange={(event) => setBucket(event.target.value)} placeholder="例如：power-design" />
                </label>
                <label className="grid gap-1">
                  <span className="text-[12px] font-medium text-[#5f6f82]">地域</span>
                  <Input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="例如：oss-cn-hangzhou" />
                </label>
                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-[12px] font-medium text-[#5f6f82]">接入地址</span>
                  <Input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="例如：oss-cn-hangzhou.aliyuncs.com" />
                </label>
                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-[12px] font-medium text-[#5f6f82]">
                    路径前缀
                    <span className="ml-1 text-[#98a2b3]">选填</span>
                  </span>
                  <Input value={prefix} onChange={(event) => setPrefix(event.target.value)} placeholder="例如：agreements/2026" />
                </label>
              </div>
            ) : null}

            {source === "smb" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-[12px] font-medium text-[#5f6f82]">主机地址</span>
                  <Input value={host} onChange={(event) => setHost(event.target.value)} placeholder="10.23.8.15" />
                </label>
                <label className="grid gap-1">
                  <span className="text-[12px] font-medium text-[#5f6f82]">端口</span>
                  <Input value={port} onChange={(event) => setPort(event.target.value)} placeholder="445" />
                </label>
                <label className="grid gap-1">
                  <span className="text-[12px] font-medium text-[#5f6f82]">共享名</span>
                  <Input value={shareName} onChange={(event) => setShareName(event.target.value)} placeholder="project" />
                </label>
                <label className="grid gap-1">
                  <span className="text-[12px] font-medium text-[#5f6f82]">目录路径</span>
                  <Input value={basePath} onChange={(event) => setBasePath(event.target.value)} placeholder="survey/2026" />
                </label>
                <label className="grid gap-1">
                  <span className="text-[12px] font-medium text-[#5f6f82]">用户名</span>
                  <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入用户名" />
                </label>
                <label className="grid gap-1">
                  <span className="text-[12px] font-medium text-[#5f6f82]">密码</span>
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" />
                </label>
                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-[12px] font-medium text-[#5f6f82]">域</span>
                  <Input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="可选，例如 company" />
                </label>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[#edf2f7] px-5 py-4">
          <div className="rounded-[12px] bg-[#f7fafd] px-3.5 py-3 text-[12px] leading-5 text-[#667085]">
            当前方式：
            <span className="ml-1 font-medium text-title">
              {selectedOption.title}
            </span>
          </div>
          {testMessage ? (
            <div className="mt-3 rounded-[12px] border border-[#d7e8d7] bg-[#f5fbf5] px-3 py-2 text-[12px] text-[#2c6b2f]">
              {testMessage}
            </div>
          ) : null}
          {error ? (
            <div className="mt-3 rounded-[12px] border border-[#f0d2d2] bg-[#fff8f8] px-3 py-2 text-[12px] text-[#a33a3a]">
              {error}
            </div>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            {source !== "hosted" ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={testing || submitting}
                onClick={() => void handleTestConnection()}
              >
                {testing ? (
                  <>
                    <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" />
                    测试中
                  </>
                ) : (
                  "测试连接"
                )}
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              disabled={submitting || testing}
              onClick={() => void handleSubmit()}
            >
              {submitting ? (
                <>
                  <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" />
                  提交中
                </>
              ) : (
                selectedOption.actionLabel
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
