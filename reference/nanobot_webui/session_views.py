"""View models for Web session listing and transcript rendering."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any


def build_session_list(session_manager) -> list[dict[str, Any]]:
    """Build a lightweight list for the sidebar."""
    items: list[dict[str, Any]] = []
    for item in session_manager.list_sessions():
        path = Path(item["path"])
        messages = _read_session_messages(path)
        turns = list(reversed(_group_turns(messages)))
        updated_at = item.get("updated_at") or item.get("created_at") or ""
        items.append({
            "key": item["key"],
            "title": _build_title(messages, item["key"]),
            "updated_at": updated_at,
            "updated_label": _format_time(updated_at),
            "message_count": len(messages),
            "turn_count": len(turns),
            "preview": _build_preview(messages),
            "path": str(path),
            "turns": [
                {
                    "index": turn["index"],
                    "anchor": turn["anchor"],
                    "title": turn["title"] or f"第 {turn['index']} 轮",
                }
                for turn in turns
            ],
        })

    items.sort(key=lambda entry: entry["updated_at"], reverse=True)
    return items


def load_session_detail(session_manager, key: str) -> dict[str, Any] | None:
    """Load one session and convert it into transcript/turn structures."""
    record = next((item for item in session_manager.list_sessions() if item["key"] == key), None)
    if not record:
        return None

    path = Path(record["path"])
    messages = _read_session_messages(path)
    turns = list(reversed(_group_turns(messages)))
    return {
        "key": key,
        "path": str(path),
        "message_count": len(messages),
        "turn_count": len(turns),
        "updated_at": record.get("updated_at") or "",
        "updated_label": _format_time(record.get("updated_at") or ""),
        "turns": turns,
    }


def _read_session_messages(path: Path) -> list[dict[str, Any]]:
    """Read session messages from one JSONL file."""
    messages: list[dict[str, Any]] = []
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            data = json.loads(line)
            if data.get("_type") == "metadata":
                continue
            messages.append(data)
    return messages


def _group_turns(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Convert a message stream into UI turns."""
    turns: list[dict[str, Any]] = []
    current: list[dict[str, Any]] = []

    for message in messages:
        if message.get("role") == "user" and current:
            turns.append(_build_turn(len(turns) + 1, current))
            current = [message]
        else:
            current.append(message)

    if current:
        turns.append(_build_turn(len(turns) + 1, current))
    return turns


def _build_turn(index: int, messages: list[dict[str, Any]]) -> dict[str, Any]:
    """Build one turn view model."""
    lead = next((message for message in messages if message.get("role") == "user"), messages[0])
    title = _message_preview(lead)
    user_message, final_message, process_messages = _split_turn_messages(messages)
    return {
        "index": index,
        "anchor": f"turn-{index}",
        "title": title or f"第 {index} 轮",
        "timestamp": _format_time(lead.get("timestamp", "")),
        "user_message": _build_message_view(user_message) if user_message else None,
        "final_message": _build_message_view(final_message) if final_message else None,
        "process_messages": [_build_message_view(message) for message in process_messages],
    }


def _split_turn_messages(
    messages: list[dict[str, Any]],
) -> tuple[dict[str, Any] | None, dict[str, Any] | None, list[dict[str, Any]]]:
    """Split one turn into user message, process messages, and final answer."""
    if not messages:
        return None, None, []

    user_index = next((i for i, message in enumerate(messages) if message.get("role") == "user"), None)
    answer_index = _find_answer_index(messages, user_index)

    user_message = messages[user_index] if user_index is not None else None
    final_message = messages[answer_index] if answer_index is not None else None

    process_messages = [
        message
        for i, message in enumerate(messages)
        if i != user_index and i != answer_index
    ]

    return user_message, final_message, process_messages


def _find_answer_index(messages: list[dict[str, Any]], user_index: int | None) -> int | None:
    """Find the best candidate for the final visible answer."""
    for i in range(len(messages) - 1, -1, -1):
        message = messages[i]
        if message.get("role") == "assistant" and not message.get("tool_calls"):
            if _render_message_content(message).strip():
                return i

    for i in range(len(messages) - 1, -1, -1):
        if i == user_index:
            continue
        message = messages[i]
        if _render_message_content(message).strip() or message.get("tool_calls"):
            return i

    return None


def _build_message_view(message: dict[str, Any]) -> dict[str, Any]:
    """Build a Web-friendly message structure."""
    role = message.get("role", "unknown")
    return {
        "role": role,
        "role_label": _role_label(role),
        "timestamp": _format_time(message.get("timestamp", "")),
        "content": _render_message_content(message),
        "tool_summary": _tool_summary(message),
    }


def _render_message_content(message: dict[str, Any]) -> str:
    """Render mixed content blocks into plain text."""
    content = message.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if not isinstance(block, dict):
                parts.append(str(block))
                continue
            block_type = block.get("type")
            if block_type == "text":
                parts.append(block.get("text", ""))
            elif block_type == "image_url":
                parts.append("[image]")
            else:
                parts.append(json.dumps(block, ensure_ascii=False, indent=2))
        return "\n".join(part for part in parts if part).strip()
    if content is None:
        return ""
    return json.dumps(content, ensure_ascii=False, indent=2)


def _tool_summary(message: dict[str, Any]) -> str:
    """Summarize assistant tool calls or tool results."""
    if message.get("role") == "assistant" and message.get("tool_calls"):
        names = []
        for tool_call in message["tool_calls"]:
            function = tool_call.get("function", {}) if isinstance(tool_call, dict) else {}
            name = function.get("name") or tool_call.get("name")
            if name:
                names.append(name)
        if names:
            return "调用工具: " + ", ".join(names)
    if message.get("role") == "tool":
        name = message.get("name") or "tool"
        return f"工具结果: {name}"
    return ""


def _build_preview(messages: list[dict[str, Any]]) -> str:
    """Build a short sidebar preview from the latest visible message."""
    for message in reversed(messages):
        preview = _message_preview(message)
        if preview:
            return preview
    return "(empty session)"


def _build_title(messages: list[dict[str, Any]], fallback: str) -> str:
    """Build the sidebar title from the first user message."""
    for message in messages:
        if message.get("role") != "user":
            continue
        title = _message_preview(message)
        if title:
            return title
    return fallback


def _message_preview(message: dict[str, Any]) -> str:
    """Return one compact preview line."""
    text = _render_message_content(message).replace("\n", " ").strip()
    return text[:72] + ("..." if len(text) > 72 else "")


def _role_label(role: str) -> str:
    return {
        "user": "用户",
        "assistant": "助手",
        "tool": "工具",
        "system": "系统",
    }.get(role, role)


def _format_time(value: str) -> str:
    """Format ISO timestamp for UI."""
    if not value:
        return ""
    try:
        return datetime.fromisoformat(value).strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return value
