# 发布前检查

- `app.yaml` 必须包含 `name`、`version`、`runtime`、`entry` 和 `healthPath`。
- 浏览器入口文件必须位于 `public/`。
- 检查源码中是否出现 API Key、Secret、私有 URL 或宿主机绝对路径。
