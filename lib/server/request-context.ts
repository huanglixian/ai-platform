import { requestIdentity } from "@/features/auth/context";

export type RequestActor = string;

export interface RequestContext {
  actor: RequestActor;
  requestId: string;
}

export function getRequestActor(): RequestActor {
  return requestIdentity()?.user.id ?? "system";
}

export function getRequestContext(): RequestContext {
  return {
    actor: getRequestActor(),
    requestId: requestIdentity()?.requestId ?? crypto.randomUUID(),
  };
}
