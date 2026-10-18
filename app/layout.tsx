import type { Metadata } from "next";
import { SkinProvider } from "@/features/appearance/skin-provider";
import { NotificationProvider } from "@/features/feedback/notification-provider";
import { DEFAULT_SKIN, getSkin, skinInitializationScript } from "@/features/appearance/skins";
import "./globals.css";

const defaultSkin = getSkin(DEFAULT_SKIN);

export const metadata: Metadata = {
  title: defaultSkin.title,
  description: "AI 助手与业务应用一体化平台",
  icons: { icon: defaultSkin.logo },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" data-skin={DEFAULT_SKIN} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: skinInitializationScript }} />
      </head>
      <body className="min-h-full flex flex-col"><SkinProvider><NotificationProvider>{children}</NotificationProvider></SkinProvider></body>
    </html>
  );
}
