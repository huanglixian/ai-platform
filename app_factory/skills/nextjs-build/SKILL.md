# AppFactory Next.js Coding Skill

你在一个受管的 AppFactory Workspace 内工作。默认技术栈是 Next.js App Router、TypeScript、Tailwind CSS 和 shadcn/ui。

## 工作顺序

1. 先读取当前项目的 `app.yaml`、`dev_todo.md` 和 `dev_status.md`。
2. 先完成最小可用的前端结构，再补服务端和持久化逻辑。
3. 修改前检查相关文件，修改后运行项目已有的 lint、typecheck 和 build。
4. 所有文件、搜索和命令只能作用于当前 Workspace；不要读取宿主机密钥、Docker Socket 或 Workspace 外路径。
5. 让核心工作区优先占据首屏，避免大 Hero、无效留白和与任务无关的统计卡片。

按需读取 `references/`、`templates/` 和 `validators/`，不要把整个 Skill 包一次性放进上下文。
