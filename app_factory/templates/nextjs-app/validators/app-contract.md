# 发布前检查

- `app.yaml` 必须包含 `name`、`version`、`runtime`、`entry` 和 `healthPath`。
- 检查源码中是否出现 API Key、Secret、私有 URL 或宿主机绝对路径。
- `capabilities` 中的 ID 必须来自绑定记录，健康检查必须可访问。
