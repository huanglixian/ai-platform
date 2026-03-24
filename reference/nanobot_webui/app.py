"""FastAPI app for the local nanobot Web UI."""

from __future__ import annotations

import argparse
import os
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from nanobot import __version__
from runtime import WebRuntime
from session_views import build_session_list, load_session_detail

_CONFIG_ENV = "NANOBOT_WEBUI_CONFIG"
_WORKSPACE_ENV = "NANOBOT_WEBUI_WORKSPACE"


class ChatRequest(BaseModel):
    """Web chat request payload."""

    content: str
    session_key: str = ""


def create_web_app(config: str | None = None, workspace: str | None = None) -> FastAPI:
    """Create the local Web UI application."""
    config = config or os.environ.get(_CONFIG_ENV)
    workspace = workspace or os.environ.get(_WORKSPACE_ENV)
    runtime = WebRuntime(config_path=config, workspace=workspace)
    base_dir = Path(__file__).parent
    templates = Jinja2Templates(directory=str(base_dir / "templates"))

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        runtime.start()
        app.state.runtime = runtime
        yield
        await runtime.close()

    app = FastAPI(
        title="nanobot Web",
        version=__version__,
        lifespan=lifespan,
    )
    app.mount("/static", StaticFiles(directory=str(base_dir / "static")), name="static")

    @app.get("/")
    async def index(request: Request, session_key: str | None = None, new: int = 0):
        sessions = build_session_list(_runtime(request).sessions)
        current_key, detail = _resolve_current_session(request, sessions, session_key, new == 1)
        security_list = _runtime(request).get_security_list_data()
        return templates.TemplateResponse(
            "index.html",
            _build_page_context(
                request,
                sessions,
                current_key,
                detail,
                security_list,
                request.query_params.get("notice", ""),
            ),
        )

    @app.post("/api/chat")
    async def api_chat(request: Request, payload: ChatRequest):
        runtime_obj = _runtime(request)
        text = payload.content.strip()
        if not text:
            return {"ok": False, "error": "empty content"}

        key = payload.session_key or runtime_obj.new_session_key()
        reply = await runtime_obj.chat(text, session_key=key)
        return {
            "ok": True,
            "session_key": key,
            "user_content": text,
            "assistant_content": reply,
            "redirect_url": f"/?session_key={key}",
        }

    @app.post("/sessions/new")
    async def new_session():
        return RedirectResponse("/?new=1", status_code=303)

    @app.post("/api/security-list")
    async def api_security_list(request: Request):
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            payload = await request.json()
            write_allow_text = str(payload.get("write_allow_text", ""))
            read_deny_text = str(payload.get("read_deny_text", ""))
        else:
            form = await request.form()
            write_allow_text = str(form.get("write_allow_text", ""))
            read_deny_text = str(form.get("read_deny_text", ""))

        data = _runtime(request).save_security_list(write_allow_text, read_deny_text)
        return {"ok": True, **data}

    @app.get("/health")
    async def health():
        return {"ok": True}

    return app


def _runtime(request: Request) -> WebRuntime:
    """Get the shared runtime from app state."""
    return request.app.state.runtime


def _resolve_current_session(
    request: Request,
    sessions: list[dict],
    session_key: str | None,
    new_session: bool = False,
):
    """Resolve the selected session for the main page."""
    runtime = _runtime(request)
    if new_session:
        return None, None
    current_key = session_key or (sessions[0]["key"] if sessions else None)
    detail = load_session_detail(runtime.sessions, current_key) if current_key else None
    return current_key, detail


def _build_page_context(
    request: Request,
    sessions: list[dict],
    current_key: str | None,
    detail: dict | None,
    security_list: dict[str, str],
    notice: str = "",
) -> dict:
    """Build the common template context."""
    runtime = _runtime(request)
    return {
        "request": request,
        "app_version": __version__,
        "workspace_path": str(runtime.config.workspace_path),
        "model_name": runtime.config.agents.defaults.model,
        "sessions": sessions,
        "current_key": current_key,
        "current_detail": detail,
        "security_list": security_list,
        "notice": notice,
    }


def main() -> None:
    """解析参数并启动本地 Web UI。"""
    parser = argparse.ArgumentParser(description="启动 nanobot 本地 Web UI")
    parser.add_argument("--host", default="127.0.0.1", help="监听地址")
    parser.add_argument("--port", type=int, default=18791, help="监听端口")
    parser.add_argument("--config", default=None, help="配置文件路径")
    parser.add_argument("--workspace", default=None, help="工作区路径")
    parser.add_argument("--reload", action="store_true", help="开发模式自动重载")
    args = parser.parse_args()

    if args.config:
        os.environ[_CONFIG_ENV] = args.config
    else:
        os.environ.pop(_CONFIG_ENV, None)

    if args.workspace:
        os.environ[_WORKSPACE_ENV] = args.workspace
    else:
        os.environ.pop(_WORKSPACE_ENV, None)

    uvicorn.run(
        "app:create_web_app",
        host=args.host,
        port=args.port,
        log_level="info",
        reload=args.reload,
        factory=True,
    )


if __name__ == "__main__":
    main()
