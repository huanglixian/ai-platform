# AppFactory 纯 HTML 应用模板

你在一个受管的 AppFactory Workspace 内工作。当前项目是无需构建工具的纯 HTML、CSS 和 JavaScript 应用，所有面向浏览器的文件都位于 `public/`。

## 工作顺序

1. 先读取当前项目的 `app.yaml`、`dev_todo.md` 和 `dev_status.md`。
2. 优先使用语义化 HTML、原生 CSS 和浏览器原生 API；没有明确价值时不要加入框架或构建工具。
3. 所有文件、搜索和命令只能作用于当前 Workspace；不要读取宿主机密钥、Docker Socket 或 Workspace 外路径。
4. 保持界面紧凑清晰，避免大 Hero、无效留白和与任务无关的统计卡片。
5. `public/` 由 Preview 与发布服务直接提供；不得自行启动或停止 Preview 进程。

按需读取 `references/` 和 `validators/`，不要把整个模板包一次性放进上下文。
