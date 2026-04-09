import { createHash } from "crypto";

import type {
  StrategyHeadingMetadata,
  StrategySliceKind,
  StrategySettingValue,
  StrategyTestResult,
  StrategyTestSlice,
} from "@/knowhub/features/strategies/types";

type MarkdownSlicerSettings = {
  headingLevels: number[];
  maxTokens: number;
  includeFrontmatter: boolean;
};

type Segment = {
  type: StrategySliceKind;
  lines: string[];
  startLine: number;
  endLine: number;
  title?: string;
  level?: number;
};

type Paragraph = {
  text: string;
  startLine: number;
  endLine: number;
  tokenCount: number;
  isBlank: boolean;
};

function countTokens(text: string) {
  const normalized = text.replace(/\s+/g, "");
  return normalized ? Array.from(normalized).length : 0;
}

function createSliceId(filePath: string, startLine: number, endLine: number) {
  return createHash("sha1")
    .update(`${filePath}:${startLine}:${endLine}`, "utf8")
    .digest("hex");
}

function toHeadingLevels(value: StrategySettingValue | undefined) {
  if (!Array.isArray(value)) {
    return [1, 2, 3];
  }

  const levels = value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= 6);

  return levels.length ? Array.from(new Set(levels)).sort((a, b) => a - b) : [1, 2, 3];
}

function toMaxTokens(value: StrategySettingValue | undefined) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue >= 0 ? nextValue : 0;
}

function toIncludeFrontmatter(value: StrategySettingValue | undefined) {
  return value === true;
}

function resolveSettings(values: Record<string, StrategySettingValue>): MarkdownSlicerSettings {
  return {
    headingLevels: toHeadingLevels(values.headingLevels),
    maxTokens: toMaxTokens(values.maxTokens),
    includeFrontmatter: toIncludeFrontmatter(values.includeFrontmatter),
  };
}

function stripFrontmatter(markdown: string) {
  if (!markdown.startsWith("---\n")) {
    return markdown;
  }

  const closingIndex = markdown.indexOf("\n---\n", 4);

  if (closingIndex < 0) {
    return markdown;
  }

  const frontmatter = markdown.slice(0, closingIndex + 5);
  const placeholder = frontmatter.replace(/[^\n]/g, "");
  return `${placeholder}${markdown.slice(closingIndex + 5)}`;
}

function toMarkdownLines(markdown: string, includeFrontmatter: boolean) {
  const normalized = markdown.replace(/\r\n?/g, "\n");
  const content = includeFrontmatter ? normalized : stripFrontmatter(normalized);
  return content.split("\n");
}

function buildSegments(lines: string[], headingLevels: number[]) {
  const segments: Segment[] = [];
  const allowedLevels = new Set(headingLevels);
  let currentHeading: Segment | null = null;
  let plainLines: string[] = [];
  let plainStartLine = 0;

  const flushPlainSegment = () => {
    if (!plainLines.length) {
      return;
    }

    segments.push({
      type: "plain",
      lines: plainLines,
      startLine: plainStartLine,
      endLine: plainStartLine + plainLines.length - 1,
    });

    plainLines = [];
  };

  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);

    if (!headingMatch) {
      if (currentHeading) {
        currentHeading.lines.push(line);
        currentHeading.endLine = lineNo;
      } else {
        if (!plainLines.length) {
          plainStartLine = lineNo;
        }

        plainLines.push(line);
      }

      return;
    }

    const level = headingMatch[1].length;

    if (!allowedLevels.has(level)) {
      if (currentHeading) {
        currentHeading.lines.push(line);
        currentHeading.endLine = lineNo;
      } else {
        if (!plainLines.length) {
          plainStartLine = lineNo;
        }

        plainLines.push(line);
      }

      return;
    }

    flushPlainSegment();

    if (currentHeading) {
      currentHeading.endLine = lineNo - 1;
      segments.push(currentHeading);
    }

    currentHeading = {
      type: "heading",
      title: headingMatch[2].trim(),
      level,
      lines: [line],
      startLine: lineNo,
      endLine: lineNo,
    };
  });

  flushPlainSegment();

  if (currentHeading) {
    currentHeading.endLine = lines.length;
    segments.push(currentHeading);
  }

  return segments;
}

function updateHeadingStack(stack: StrategyHeadingMetadata[], segment: Segment) {
  if (!segment.level || !segment.title) {
    return;
  }

  while (stack.length && stack[stack.length - 1].level >= segment.level) {
    stack.pop();
  }

  stack.push({
    title: segment.title,
    level: segment.level,
  });
}

function createSlice(
  filePath: string,
  content: string,
  tokenCount: number,
  kind: StrategySliceKind,
  startLine: number,
  endLine: number,
  parentHeadings: StrategyHeadingMetadata[],
  heading?: StrategyHeadingMetadata,
): StrategyTestSlice {
  return {
    id: createSliceId(filePath, startLine, endLine),
    content,
    tokenCount,
    kind,
    heading,
    parentHeadings,
    range: {
      startLine,
      endLine,
    },
  };
}

function buildParagraphs(segment: Segment) {
  const paragraphs: Paragraph[] = [];
  let bufferLines: string[] = [];
  let bufferStartLine = 0;

  const flushBuffer = (endLine: number) => {
    if (!bufferLines.length) {
      return;
    }

    const text = bufferLines.join("\n");

    paragraphs.push({
      text,
      startLine: bufferStartLine,
      endLine,
      tokenCount: countTokens(text),
      isBlank: false,
    });

    bufferLines = [];
  };

  segment.lines.forEach((line, index) => {
    const absoluteLine = segment.startLine + index;

    if (!line.trim()) {
      flushBuffer(absoluteLine - 1);
      paragraphs.push({
        text: "",
        startLine: absoluteLine,
        endLine: absoluteLine,
        tokenCount: 0,
        isBlank: true,
      });
      return;
    }

    if (!bufferLines.length) {
      bufferStartLine = absoluteLine;
    }

    bufferLines.push(line);
  });

  flushBuffer(segment.endLine);
  return paragraphs;
}

function buildPlainSlices(
  filePath: string,
  segment: Segment,
  maxTokens: number,
  parentHeadings: StrategyHeadingMetadata[],
) {
  const paragraphs = buildParagraphs(segment);
  const slices: StrategyTestSlice[] = [];
  let currentChunk: Paragraph[] = [];
  let currentTokens = 0;
  let chunkStartLine = segment.startLine;

  const flushChunk = (endLine: number) => {
    if (!currentChunk.length || !currentChunk.some((item) => !item.isBlank)) {
      currentChunk = [];
      currentTokens = 0;
      return;
    }

    const content = currentChunk
      .map((item) => item.text)
      .join("\n")
      .trim();

    if (content) {
      slices.push(
        createSlice(
          filePath,
          content,
          currentTokens,
          "plain",
          chunkStartLine,
          endLine,
          parentHeadings,
        ),
      );
    }

    currentChunk = [];
    currentTokens = 0;
    chunkStartLine = endLine + 1;
  };

  for (const paragraph of paragraphs) {
    if (!currentChunk.length && paragraph.isBlank) {
      continue;
    }

    if (!currentChunk.length) {
      chunkStartLine = paragraph.startLine;
    }

    currentChunk.push(paragraph);

    if (!paragraph.isBlank) {
      currentTokens += paragraph.tokenCount;
    }

    if (maxTokens > 0 && currentTokens >= maxTokens) {
      flushChunk(paragraph.endLine);
    }
  }

  if (currentChunk.length) {
    flushChunk(segment.endLine);
  }

  return slices;
}

export function runMarkdownObsidianSlicer(input: {
  filePath: string;
  content: string;
  values: Record<string, StrategySettingValue>;
}): StrategyTestResult {
  const settings = resolveSettings(input.values);
  const segments = buildSegments(
    toMarkdownLines(input.content, settings.includeFrontmatter),
    settings.headingLevels,
  );
  const headingStack: StrategyHeadingMetadata[] = [];
  const slices: StrategyTestSlice[] = [];

  for (const segment of segments) {
    if (segment.type === "heading") {
      updateHeadingStack(headingStack, segment);

      const [, ...bodyLines] = segment.lines;
      const body = bodyLines.join("\n").trim();

      if (!body || !segment.title || !segment.level) {
        continue;
      }

      slices.push(
        createSlice(
          input.filePath,
          body,
          countTokens(body),
          "heading",
          segment.startLine,
          segment.endLine,
          headingStack.slice(0, -1),
          {
            title: segment.title,
            level: segment.level,
          },
        ),
      );
      continue;
    }

    slices.push(
      ...buildPlainSlices(
        input.filePath,
        segment,
        settings.maxTokens,
        [...headingStack],
      ),
    );
  }

  return {
    sliceCount: slices.length,
    slices,
  };
}
