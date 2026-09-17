# 事务、并发、幂等与迁移

数据库访问使用 `src/server/db/database.ts` 的参数化 `query()` 和 `transaction()`。多人领取、审批、库存扣减等竞争操作不要“先读后无条件写”；在事务中用条件 `UPDATE`、行锁或版本号，并检查受影响行数。冲突必须返回明确结果。

对可被浏览器重发的写请求，在事务内调用 `executeIdempotently(client, input, work)`。幂等键按用户、操作和请求内容隔离：同键同请求复用结果，同键不同请求返回冲突。Job 的 `idempotencyKey` 也必须是业务稳定键。

迁移统一在 `db/migrations/`：

- `0001–0999`：Framework 受管，不能新增、改名或修改；
- `1000–8999`：应用业务迁移，只追加、不回写已执行文件；
- `9000–9999`：保留，不能使用。

迁移器会创建应用 Schema、取得 PostgreSQL advisory lock、按编号执行，并校验已执行文件 checksum。不要手工把业务表塞进 Framework 迁移，也不要在发布后删除或改写已经执行的业务迁移。
