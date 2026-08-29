export type RequestActor = "local-user" | "system";

export interface RequestContext {
  actor: RequestActor;
  requestId: string;
}

export function getRequestActor(request?: Request): RequestActor {
  return request?.headers.get("x-agenthub-actor") === "system" ? "system" : "local-user";
}

export function getRequestContext(request?: Request): RequestContext {
  return {
    actor: getRequestActor(request),
    requestId: request?.headers.get("x-request-id") || crypto.randomUUID(),
  };
}
