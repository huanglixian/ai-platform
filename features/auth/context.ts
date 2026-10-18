import { AsyncLocalStorage } from "node:async_hooks";
import type { Principal } from "./types";
import { AuthError } from "./errors";

const context = new AsyncLocalStorage<{ user: Principal; requestId: string }>();
export function requestIdentity() {
  return context.getStore();
}
export function currentUser() {
  return context.getStore()?.user;
}
export function requireRequestUser() {
  const user = currentUser();
  if (!user) throw new AuthError("请先登录", 401);
  return user;
}
export function runAsUser<T>(
  user: Principal,
  callback: () => T,
  requestId = crypto.randomUUID(),
) {
  return context.run({ user, requestId }, callback);
}
