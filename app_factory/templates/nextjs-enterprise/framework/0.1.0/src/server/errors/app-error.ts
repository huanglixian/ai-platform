export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: Record<string, unknown>) =>
  new AppError(400, "bad_request", message, details);

export const unauthorized = (message = "需要登录") =>
  new AppError(401, "unauthorized", message);

export const forbidden = (message = "没有执行此操作的权限") =>
  new AppError(403, "forbidden", message);

export const notFound = (message = "资源不存在") =>
  new AppError(404, "not_found", message);

export const conflict = (message: string) =>
  new AppError(409, "conflict", message);
