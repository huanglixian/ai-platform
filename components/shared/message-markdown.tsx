"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MessageMarkdownProps = {
  content: string;
};

export const MessageMarkdown = memo(function MessageMarkdown({
  content,
}: MessageMarkdownProps) {
  return (
    <div className="message-markdown mt-1.5 text-[13px] leading-5.5 text-title">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            const external =
              typeof href === "string" &&
              !href.startsWith("/") &&
              !href.startsWith("#");

            return (
              <a
                {...props}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer noopener" : undefined}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
});
