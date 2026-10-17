import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "广昱 · 智能体中台",
  description: "AI 助手与业务应用一体化平台",
  icons: { icon: "/branding/guangyu-logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
