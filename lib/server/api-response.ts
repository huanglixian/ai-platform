import { NextResponse } from "next/server";
import { getRequestContext } from "./request-context";

export const AGENTHUB_API_VERSION = "v1";

function transportHeaders() {
  const context = getRequestContext();
  return {
    "Cache-Control": "no-store",
    "X-AgentHub-API-Version": AGENTHUB_API_VERSION,
    "X-Request-Id": context.requestId,
    "X-Request-Actor": context.actor,
  };
}

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, {
    ...init,
    headers: { ...transportHeaders(), ...init?.headers },
  });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { error: { message, ...(details === undefined ? {} : { details }) } },
    { status, headers: transportHeaders() },
  );
}
