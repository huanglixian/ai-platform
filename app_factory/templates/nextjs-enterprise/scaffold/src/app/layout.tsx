import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "{{APP_NAME_JS}}",
  description: "由 AppFactory 创建的 Next.js 企业应用",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-theme="ocean" lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
