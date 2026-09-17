# 持久化 Job、Worker、消息与审计

普通短请求不必入队。导入导出、批量处理、外部 AI 调用或可能超过请求生命周期的任务使用 `enqueueJob()`；它将状态和幂等键持久化到 PostgreSQL。

```ts
await enqueueJob({
  type: "customer.import",
  payload: { importId },
  actorUserId: principal.userId,
  idempotencyKey: `customer-import:${importId}`,
});
```

在 `worker/index.ts` 注册本应用的 Handler。Handler 声明每类 Job 的并发上限，并假定它可能被重试：

```ts
const jobHandlers: JobHandlers = {
  "customer.import": {
    concurrency: 2,
    async handle({ payload, actorUserId }) {
      // 只写业务处理；重复执行仍要安全。
    },
  },
};
```

只有 `app.yaml` 声明 `workerEntry` 时，发布过程才启动 Worker。Framework 会领取、续租、退避重试和记录失败，但不能替业务保证外部邮件、付款或第三方调用的 exactly-once。

业务状态、Job、消息和审计尽量在同一 `transaction()` 中提交。`sendNotification(client, input)` 用于站内消息；`recordAudit(client, input)` 或 `appendAudit(input)` 用于审计。对可重复产生的消息/审计传入稳定 `dedupeKey`。
