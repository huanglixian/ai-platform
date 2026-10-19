---
name: external-app-deploy
description: 在 AI Platform 为上传的可信 Node.js 或 Python Web 源码准备依赖、构建并交付可重复执行的启动配置。
---

# 外部应用部署

- 当前目录是应用 `workspace/`；同级 `config/`、`data/`、`logs/` 由平台创建。只修改本应用目录，不修改平台或其他项目，不安装全局包、不使用 sudo。
- 先检查 README、依赖清单和锁文件。保留原技术栈和包管理器；Python 在本应用创建 `.venv` 并使用其中的解释器；Node.js 在项目中安装自己的依赖。先选定最终工作目录再创建虚拟环境。
- 应用配置在 `../config/app.env`，启动器会注入；业务数据优先使用 `APP_DATA_DIR`。启动端口使用平台提供的 `PORT`，监听回环地址。不要输出密钥或整个配置文件。
- 执行必要的安装与构建，允许为部署调整启动配置。启动命令必须前台运行，不使用后台化、nohup、PM2 或自行创建常驻服务；平台负责启动、健康检查和进程回收。
- 如果缺少运行时、系统软件、外部服务或用户配置，停止安装，明确需要补充什么。不能通过猜测密钥或反复重试解决。
- 最终将结果写入 `../config/runtime.json`（此路径相对最初的 workspace）。就绪示例：
  `{"status":"ready","command":".venv/bin/python main.py","workingDirectory":".","healthPath":"/","startupTimeoutSeconds":30,"message":"依赖已安装"}`。
  Node.js 的 command 可以是 `npm run start`；工作目录相对 workspace，不能越界。不要在 command 中写入密钥。
- 等待配置时写入 `{"status":"needs_config","missingConfig":["DATABASE_URL：需要可连接的数据库地址"],"message":"请补充配置后继续"}`。平台会在用户补充说明和环境变量后重新执行；先检查已完成步骤，避免重复破坏性操作。
