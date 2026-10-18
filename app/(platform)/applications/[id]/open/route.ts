import { NextResponse } from "next/server";
import { requirePageUser } from "@/features/auth/server";
import { canUseResource, getResourcePolicy } from "@/features/access/server";
import { applicationEntry } from "@/features/apps/server";
import { isolatedApplicationUrl } from "@/features/auth/origin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requirePageUser();
  const { id } = await params;
  if (!canUseResource(user, getResourcePolicy("application", id)))
    return new Response("应用不存在或无权访问", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  const app = applicationEntry(id);
  if (
    !app ||
    app.status !== "active" ||
    (app.source === "external" && app.launchStatus !== "running")
  )
    return new Response("应用暂不可用，请返回首页查看状态", {
      status: 409,
      headers: { "Cache-Control": "no-store" },
    });
  return NextResponse.redirect(isolatedApplicationUrl(app.url), {
    status: 302,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}
