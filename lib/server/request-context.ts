export type RequestActor = "local-user" | "system";

export interface RequestContext {
  actor: RequestActor;
}

export function getRequestActor(): RequestActor {
  return "local-user";
}

export function getRequestContext(): RequestContext {
  return { actor: getRequestActor() };
}
