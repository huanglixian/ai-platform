import { logError } from "../observability/logger.ts";
import { AppError } from "./app-error.ts";

export function errorResponse(error: unknown, requestId?: string) {
  if (error instanceof AppError) {
    return Response.json(
      { error: { code: error.code, message: error.message, details: error.details, requestId } },
      { status: error.status },
    );
  }
  logError("请求处理失败", { requestId, error });
  return Response.json(
    { error: { code: "internal_error", message: "服务暂时不可用，请稍后重试", requestId } },
    { status: 500 },
  );
}
