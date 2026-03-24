# nanobot Web UI

这是一个本地 Web 控制台，用来把 `nanobot` 的直连对话能力包装成网页界面，主要用于本地使用和调试。

它不属于 `nanobot` 官方 CLI / gateway 主链路，只负责：

- 调用父项目的 `AgentLoop`
- 读取父项目已有的 session 数据
- 提供网页查看和发送消息

## 目录结构

```text
my_customize/nanobot_webui/
├── app.py
├── runtime.py
├── session_views.py
├── requirements.txt
├── templates/
│   ├── index.html
│   └── partials/
│       ├── composer.html
│       ├── message_card.html
│       ├── security_panel.html
│       ├── sidebar.html
│       ├── topbar.html
│       ├── transcript.html
│       └── turn_card.html
└── static/
    ├── app.css
    ├── app.js
    ├── js/
    │   ├── chat.js
    │   ├── dom.js
    │   └── security.js
    └── styles/
        ├── base.css
        ├── chat.css
        ├── components.css
        ├── layout.css
        ├── security.css
        └── tokens.css
```

几个关键文件：

- `app.py`
  FastAPI 入口
- `runtime.py`
  Web UI 和父项目的连接层，负责加载配置、创建 provider、初始化 `AgentLoop`
- `session_views.py`
  把 session JSONL 转成页面可用的数据结构
- `templates/index.html`
  页面总骨架，只负责拼接各个 partial
- `templates/partials/`
  页面分块模板，分别负责顶栏、左栏、消息区、记录区、右栏
- `static/styles/`
  样式分层目录
- `static/js/`
  前端交互脚本，按功能拆分

## 当前页面结构

当前页面是固定满屏的三栏工作台：

- 顶部：全宽 `topbar`
- 左侧：会话与轮次
- 中间：发送消息 + 对话记录
- 右侧：名单配置

桌面端默认使用满屏高度，三栏各自内部滚动；移动端退回普通页面滚动。

## 风格与用色

当前风格不是营销页，而是偏 Dify 气质的本地工作台：

- 白底、灰白底、蓝灰中性色
- 轻边框、轻阴影、小圆角
- 信息密度偏高，但留白克制
- 标题条统一使用紧凑工具栏样式

主要颜色：

- 主蓝：`#2970ff`
- 主蓝 hover：`#155eef`
- 深蓝强调：`#004eeb`
- 页面底：`#f9fafb`
- 侧栏底：`#f5f7fb`
- 面板白：`#ffffff`
- 主文字：`#101828`
- 次文字：`#475467`
- 辅助文字：`#667085`
- 分割线：`#eaecf0`

## 样式组织

样式入口：

- `static/app.css`

分层规则：

- `tokens.css`
  颜色、圆角、阴影、间距 token
- `base.css`
  全局基础样式
- `layout.css`
  页面框架、顶栏、工作台布局
- `components.css`
  按钮、列表卡片、输入框、标签等通用组件
- `chat.css`
  消息区、对话记录区
- `security.css`
  名单配置区

维护时优先保持：

- 结构改动放模板
- 通用控件改 `components.css`
- 三栏布局改 `layout.css`
- 聊天与记录区细节改 `chat.css`
- 名单区细节改 `security.css`

## 前端交互

脚本入口：

- `static/app.js`

拆分规则：

- `js/chat.js`
  发送消息、处理中占位、跳转刷新
- `js/security.js`
  保存白名单/黑名单
- `js/dom.js`
  小型 DOM 工具函数

当前前端保持原生 JS，不引入 htmx、alpine 或前端框架。

## 运行前提

运行前至少要满足：

- 父项目 `nanobot` 本体可以正常导入
- provider 配置已经可用
- `nanobot` 的工作区和配置文件能正常加载

如果父项目本身跑不起来，这个 Web UI 也不会正常工作。

## 安装依赖

在当前目录执行：

```bash
pip install -r requirements.txt
```

如果父项目依赖还没装，还需要先按父项目自己的方式准备环境。

## 启动方式

在当前目录执行：

```bash
python app.py
```

默认监听：

- `127.0.0.1:18791`

开发模式：

```bash
python app.py --reload
```

也可以指定配置文件、工作区、地址和端口：

```bash
python app.py \
  --host 127.0.0.1 \
  --port 18791 \
  --config /path/to/config.json \
  --workspace /path/to/workspace
```

启动参数：

- `--host`
  监听地址，默认 `127.0.0.1`
- `--port`
  监听端口，默认 `18791`
- `--config`
  配置文件路径
- `--workspace`
  工作区路径
- `--reload`
  开发模式自动重载

## macOS 常驻服务

本项目可以通过 macOS 的 `launchd` 配置为当前用户的常驻服务。

示例配置文件：

- `com.hlx.nanobot-webui.plist`

启动前先检查这个文件里的内容是否和你当前环境一致：

- Python 解释器路径
- `app.py` 路径
- `WorkingDirectory`
- `stdout.log` / `stderr.log` 路径
- 是否带了 `--reload`
- 对应 Python 环境里是否已经安装了运行依赖

如果你最近移动过目录，或者切换过 conda / venv 环境，这一步一定要先做。

当前这份 `plist` 已经按开发模式配置了 `--reload`。  
也就是说，改动 `my_customize/nanobot_webui/` 下的代码后，服务会自动重载。

安装为用户级服务：

```bash
mkdir -p ~/Library/LaunchAgents
cp com.hlx.nanobot-webui.plist ~/Library/LaunchAgents/com.hlx.nanobot-webui.plist
```

启动服务：

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.hlx.nanobot-webui.plist
```

停止服务：

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.hlx.nanobot-webui.plist
```

重启服务：

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.hlx.nanobot-webui.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.hlx.nanobot-webui.plist
```

查看服务状态：

```bash
launchctl print gui/$(id -u)/com.hlx.nanobot-webui
```

查看日志：

```bash
tail -f logs/stdout.log
tail -f logs/stderr.log
```

## 核心执行链路

主链路很短：

1. `app.py` 创建 FastAPI 应用
2. lifespan 启动 `WebRuntime`
3. `WebRuntime` 加载配置并初始化 `AgentLoop`
4. 前端把消息发到 `/api/chat`
5. 后端调用 `AgentLoop.process_direct(...)`
6. 回复继续写入父项目原有的 session JSONL

这也说明它和父项目的边界很清楚：

- agent 行为在父项目里
- provider 选择在父项目配置里
- 会话持久化在父项目 session 体系里
- 本目录主要负责页面展示和运行时装配

## 常用接口

- `GET /`
  主页
- `POST /api/chat`
  发送聊天消息
- `POST /sessions/new`
  新建会话
- `GET /health`
  健康检查

## 维护建议

这个目录应当保持轻量，不要把主业务逻辑堆进来。

维护原则：

- 页面是服务端渲染 + 少量原生 JS，不要往这里堆业务逻辑
- `AgentLoop` 相关逻辑仍然只在 Python 侧
- 新增视觉改动时，优先复用现有标题条、按钮、输入框和卡片样式
- 没用的样式、模板类名、脚本函数要及时删掉，不要继续堆积

排查时优先这样看：

- 页面展示问题
  先看 `session_views.py` 和模板
- 发送消息异常
  先看 `runtime.py` 和 `app.py`
- CLI 正常但 Web UI 行为不一致
  先看 `runtime.py` 有没有把主包新增参数继续传给 `AgentLoop`
- agent 回复策略异常
  回父项目 `nanobot/agent/loop.py`
- provider 或配置问题
  回父项目 `nanobot/config/` 和 `nanobot/providers/`
