import { NextResponse } from "next/server";

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: { message, ...(details === undefined ? {} : { details }) } }, { status });
}
