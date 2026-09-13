# AI Platform

面向演示的单机 AI 应用平台：AppFactory 负责创建、开发、预览并一键发布 Next.js 应用；应用中心展示 AppFactory、原生、Dify 和 n8n 应用。

## 运行

```bash
npm run dev
```

启动器会同时运行平台（`http://localhost:19844`）和 AppFactory 发布 Worker。发布不使用 Docker：Worker 为每个项目构建 Next.js standalone Release，分配本机端口并进行健康检查，成功后注册到应用中心。

需要在 `.env.local` 配置：

```bash
AGENT_HUB_BASE_URL=http://localhost:19844
```

## AppFactory 发布

在 `/appfactory` 创建或打开项目，开发完成后点击“发布”。发布任务依次校验 `app.yaml`、运行 lint/typecheck/Next.js build、生成独立 Release、启动并健康检查，再注册到应用中心。任务可在顶栏“任务中心”查看、取消和重试；成功任务提供应用入口与应用中心链接。

项目 Workspace、Pi 会话与发布任务存放在 `data/storage/appfactory`；Release 会在 Worker 重启时按持久化部署记录恢复。应用中心的 AppFactory 卡片由发布流程管理，不能通过手工发布表单创建。`data/settings` 是随 Git 管理的平台配置，`data/storage` 是本机运行数据，不应提交。
