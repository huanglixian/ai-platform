import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ai Platform",
  description: "AI 助手与业务应用一体化平台",
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
