import type { Metadata } from "next";
import { SkinProvider } from "@/features/appearance/skin-provider";
import { NotificationProvider } from "@/features/feedback/notification-provider";
import { DEFAULT_SKIN, getSkin, skinInitializationScript } from "@/features/appearance/skins";
import "./globals.css";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { configuredPlatformOrigin, isPlatformHost } from "@/features/auth/origin";
import { AuthProvider } from "@/features/auth/auth-provider";
import { readSession, sessionCookie } from "@/features/auth/session";

const defaultSkin = getSkin(DEFAULT_SKIN);

export const metadata: Metadata = {
  title: defaultSkin.title,
  description: "AI 助手与业务应用一体化平台",
  icons: { icon: defaultSkin.logo },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const host = (await headers()).get("host");
  if (host && !isPlatformHost(new URL(`http://${host}`).hostname)) redirect(new URL("/login", configuredPlatformOrigin()).href);
  const user = readSession((await cookies()).get(sessionCookie)?.value);
  return (
    <html lang="zh-CN" className="h-full antialiased" data-skin={DEFAULT_SKIN} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: skinInitializationScript }} />
      </head>
      <body className="min-h-full flex flex-col"><AuthProvider user={user}><SkinProvider><NotificationProvider>{children}</NotificationProvider></SkinProvider></AuthProvider></body>
    </html>
  );
}
