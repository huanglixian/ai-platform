import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ai Platform",
  description: "面向 AI 工作台的前端原型",
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
