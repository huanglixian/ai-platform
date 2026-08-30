export class SessionBusyError extends Error {
  constructor() {
    super("该对话正在执行，请等待当前任务完成");
    this.name = "SessionBusyError";
  }
}
