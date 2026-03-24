"""Shared runtime for the local Web UI."""

from __future__ import annotations

import json
from pathlib import Path
from uuid import uuid4

from nanobot.agent.loop import AgentLoop
from nanobot.bus.queue import MessageBus
from nanobot.config.loader import load_config, set_config_path
from nanobot.config.paths import get_cron_dir
from nanobot.cron.service import CronService
from nanobot.utils.helpers import sync_workspace_templates


class WebRuntime:
    """Owns config, provider, agent loop, and session access for the Web UI."""

    def __init__(self, config_path: str | None = None, workspace: str | None = None):
        self._config_path = Path(config_path).expanduser().resolve() if config_path else None
        self._workspace_override = workspace
        self.config = None
        self.bus: MessageBus | None = None
        self.cron: CronService | None = None
        self.agent: AgentLoop | None = None

    def start(self) -> None:
        """Initialize the shared runtime objects."""
        if self._config_path:
            set_config_path(self._config_path)

        self.config = load_config(self._config_path)
        if self._workspace_override:
            self.config.agents.defaults.workspace = self._workspace_override

        sync_workspace_templates(self.config.workspace_path)

        self.bus = MessageBus()
        self.cron = CronService(get_cron_dir() / "jobs.json")
        self.agent = AgentLoop(
            bus=self.bus,
            provider=self._make_provider(),
            workspace=self.config.workspace_path,
            model=self.config.agents.defaults.model,
            max_iterations=self.config.agents.defaults.max_tool_iterations,
            context_window_tokens=self.config.agents.defaults.context_window_tokens,
            web_search_config=self.config.tools.web.search,
            web_proxy=self.config.tools.web.proxy or None,
            exec_config=self.config.tools.exec,
            cron_service=self.cron,
            restrict_to_workspace=self.config.tools.restrict_to_workspace,
            security_list_file=self.config.tools.security_list_file,
            mcp_servers=self.config.tools.mcp_servers,
            channels_config=self.config.channels,
        )

    async def close(self) -> None:
        """Release shared resources."""
        if self.agent:
            self.agent.stop()
            await self.agent.close_mcp()

    async def chat(self, content: str, session_key: str | None = None) -> str:
        """Send one message through the shared agent and return the final text."""
        if not self.agent:
            raise RuntimeError("Web runtime is not initialized")

        key = session_key or self.new_session_key()
        chat_id = key.split(":", 1)[1] if ":" in key else key
        response = await self.agent.process_direct(
            content,
            session_key=key,
            channel="web",
            chat_id=chat_id,
        )
        return (response.content if response else "").strip() or "(empty response)"

    def new_session_key(self) -> str:
        """Create a new Web session key."""
        return f"web:{uuid4().hex[:12]}"

    @property
    def sessions(self):
        """Expose the session manager from the shared agent."""
        if not self.agent:
            raise RuntimeError("Web runtime is not initialized")
        return self.agent.sessions

    def get_security_list_data(self) -> dict[str, str]:
        """读取 security_list.json，并转成页面可编辑文本。"""
        path = self._security_list_path()
        data = self._load_security_list(path)
        workspace_markers = {"{workspace}", str(self.config.workspace_path.resolve(strict=False))}

        write_allow = [
            item for item in data.get("writeAllow", [])
            if item.strip() and item.strip() not in workspace_markers
        ]
        read_deny = [item for item in data.get("readDeny", []) if item.strip()]

        return {
            "path": str(path),
            "write_allow_text": "\n".join(write_allow),
            "read_deny_text": "\n".join(read_deny),
        }

    def save_security_list(self, write_allow_text: str, read_deny_text: str) -> dict[str, str]:
        """保存 security_list.json。"""
        path = self._security_list_path()
        path.parent.mkdir(parents=True, exist_ok=True)

        write_allow = self._normalize_lines(write_allow_text)
        read_deny = self._normalize_lines(read_deny_text)

        write_allow = [item for item in write_allow if item != "{workspace}"]
        payload = {
            "readDeny": read_deny,
            "writeAllow": ["{workspace}", *write_allow],
        }
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return self.get_security_list_data()

    def _security_list_path(self) -> Path:
        raw = self.config.tools.security_list_file or "~/.nanobot/security_list.json"
        return Path(raw).expanduser().resolve(strict=False)

    @staticmethod
    def _normalize_lines(text: str) -> list[str]:
        seen: set[str] = set()
        items: list[str] = []
        for raw in text.splitlines():
            value = raw.strip()
            if not value or value in seen:
                continue
            seen.add(value)
            items.append(value)
        return items

    @staticmethod
    def _load_security_list(path: Path) -> dict:
        if not path.exists():
            return {"readDeny": [], "writeAllow": ["{workspace}"]}

        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return {"readDeny": [], "writeAllow": ["{workspace}"]}

        if not isinstance(data, dict):
            return {"readDeny": [], "writeAllow": ["{workspace}"]}
        if not isinstance(data.get("readDeny"), list):
            data["readDeny"] = []
        if not isinstance(data.get("writeAllow"), list):
            data["writeAllow"] = ["{workspace}"]
        return data

    def _make_provider(self):
        """Create the configured provider for Web requests."""
        from nanobot.providers.azure_openai_provider import AzureOpenAIProvider
        from nanobot.providers.base import GenerationSettings
        from nanobot.providers.openai_codex_provider import OpenAICodexProvider

        model = self.config.agents.defaults.model
        provider_name = self.config.get_provider_name(model)
        provider_config = self.config.get_provider(model)

        if provider_name == "openai_codex" or model.startswith("openai-codex/"):
            provider = OpenAICodexProvider(default_model=model)
        elif provider_name == "custom":
            from nanobot.providers.custom_provider import CustomProvider

            provider = CustomProvider(
                api_key=provider_config.api_key if provider_config else "no-key",
                api_base=self.config.get_api_base(model) or "http://localhost:8000/v1",
                default_model=model,
                extra_headers=provider_config.extra_headers if provider_config else None,
            )
        elif provider_name == "azure_openai":
            if not provider_config or not provider_config.api_key or not provider_config.api_base:
                raise RuntimeError("Azure OpenAI requires api_key and api_base in config")
            provider = AzureOpenAIProvider(
                api_key=provider_config.api_key,
                api_base=provider_config.api_base,
                default_model=model,
            )
        else:
            from nanobot.providers.litellm_provider import LiteLLMProvider
            from nanobot.providers.registry import find_by_name

            spec = find_by_name(provider_name)
            if (
                not model.startswith("bedrock/")
                and not (provider_config and provider_config.api_key)
                and not (spec and (spec.is_oauth or spec.is_local))
            ):
                raise RuntimeError("No API key configured for the selected provider")
            provider = LiteLLMProvider(
                api_key=provider_config.api_key if provider_config else None,
                api_base=self.config.get_api_base(model),
                default_model=model,
                extra_headers=provider_config.extra_headers if provider_config else None,
                provider_name=provider_name,
            )

        defaults = self.config.agents.defaults
        provider.generation = GenerationSettings(
            temperature=defaults.temperature,
            max_tokens=defaults.max_tokens,
            reasoning_effort=defaults.reasoning_effort,
        )
        return provider
