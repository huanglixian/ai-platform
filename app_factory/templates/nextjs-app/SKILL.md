# AppFactory Next.js 应用模板

你在一个受管的 AppFactory Workspace 内工作。当前项目使用 Next.js App Router、TypeScript、Tailwind CSS 和 shadcn/ui。

## 工作顺序

1. 先读取当前项目的 `app.yaml`、`dev_todo.md` 和 `dev_status.md`。
2. 先完成最小可用的前端结构，再补服务端和持久化逻辑。
3. 修改前检查相关文件，修改后运行项目已有的 lint 和 typecheck。若 `.next/dev/lock` 存在，说明 AppFactory Preview 正在运行，此时不要执行 build。
4. 所有文件、搜索和命令只能作用于当前 Workspace；不要读取宿主机密钥、Docker Socket 或 Workspace 外路径。
5. 让核心工作区优先占据首屏，避免大 Hero、无效留白和与任务无关的统计卡片。
6. `.next`、`node_modules` 和 AppFactory Preview 由平台管理；不得删除、移动或清理这些目录，也不得启动或停止 Preview 进程。

按需读取 `references/`、`snippets/` 和 `validators/`，不要把整个模板包一次性放进上下文。
