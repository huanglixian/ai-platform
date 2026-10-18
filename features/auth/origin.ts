export function configuredPlatformOrigin() {
  const configured = process.env.AGENT_HUB_BASE_URL?.trim();
  if (!configured) throw new Error("缺少 AGENT_HUB_BASE_URL");
  return new URL(configured).origin;
}

export function isPlatformHost(hostname: string) {
  return hostname === new URL(configuredPlatformOrigin()).hostname;
}

export function isolatedApplicationUrl(value: string) {
  const target = new URL(value);
  const platform = new URL(configuredPlatformOrigin());
  if (!["http:", "https:"].includes(target.protocol))
    throw new Error("应用地址必须使用 HTTP 或 HTTPS");
  if (
    target.hostname !== platform.hostname ||
    target.origin === platform.origin
  )
    return target.href;
  if (target.hostname === "localhost") target.hostname = "127.0.0.1";
  else if (target.hostname === "127.0.0.1") target.hostname = "localhost";
  else throw new Error("应用与平台需要使用不同主机名，以隔离登录状态");
  return target.href;
}
