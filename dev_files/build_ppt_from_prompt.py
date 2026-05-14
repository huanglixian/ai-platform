from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "transmission-agent-platform-ppt.md"
INTERMEDIATE = ROOT / "transmission-agent-platform-ppt.slides.md"


def normalize_text(value: str) -> str:
    return (
        value.replace("\u00a0", " ")
        .replace("：", ": ")
        .replace(" + ", " + ")
        .strip()
    )


def parse_sections(raw: str) -> list[str]:
    body = raw.strip()
    if body.startswith("PPT生成说明："):
        parts = body.split("\n---\n", 1)
        if len(parts) == 2:
            body = parts[1]
    return [section.strip() for section in body.split("\n---\n") if section.strip()]


def extract_field(section: str, label: str) -> str:
    pattern = rf"{re.escape(label)}[ \t]*([^\n]+)"
    matched = re.search(pattern, section)
    return normalize_text(matched.group(1)) if matched else ""


def extract_list(section: str, label: str) -> list[str]:
    marker = f"{label}\n"
    if marker not in section:
        return []

    tail = section.split(marker, 1)[1]
    stop_positions = []
    for next_label in ("呈现形式：", "内容说明：", "内容："):
        pos = tail.find(f"\n{next_label}\n")
        if pos != -1:
            stop_positions.append(pos)
    if stop_positions:
        tail = tail[: min(stop_positions)]

    items: list[str] = []
    current_parent = ""
    for line in tail.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("- "):
            item = normalize_text(stripped[2:])
            items.append(item)
            current_parent = item
            continue
        if stripped.startswith(("-\t", "-    ")):
            item = normalize_text(stripped[1:].strip())
            items.append(item)
            current_parent = item
            continue
        if stripped.startswith(("* ", "• ")):
            item = normalize_text(stripped[2:])
            items.append(item)
            current_parent = item
            continue
        if line.startswith((" ", "\t")) and current_parent:
            items.append(normalize_text(stripped))
    return items


def build_slide(section: str) -> str:
    title = extract_field(section, "主标题：")
    subtitle = extract_field(section, "副标题：")

    content_items = extract_list(section, "内容说明：")
    if not content_items:
        content_items = extract_list(section, "内容：")

    layout_items = extract_list(section, "呈现形式：")

    lines: list[str] = [f"# {title}"]
    if subtitle:
        lines.extend(["", f"## {subtitle}"])

    if content_items:
        lines.extend(["", "### 内容"])
        lines.extend([f"- {item}" for item in content_items])

    if layout_items:
        lines.extend(["", "### 呈现形式"])
        lines.extend([f"- {item}" for item in layout_items])

    return "\n".join(lines).strip()


def main() -> None:
    raw = SOURCE.read_text(encoding="utf-8")
    sections = parse_sections(raw)

    slides = [
        "% 数智输电智能体平台设想",
        "% 面向数智输电的智能体平台原型说明",
        "% 广东省电力设计院（输电板块）",
        "",
    ]

    for index, section in enumerate(sections):
        if index > 0:
            slides.extend(["", "---", ""])
        slides.append(build_slide(section))

    INTERMEDIATE.write_text("\n".join(slides).strip() + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
