import { checkHealth } from "@/server/observability/health";

export const runtime = "nodejs";

export async function GET() {
  try {
    const health = await checkHealth();
    if (!health.ok) return Response.json({ error: { message: health.reason } }, { status: 503 });
    return Response.json({ data: { status: "ok" } });
  } catch {
    return Response.json({ error: { message: "数据库未就绪" } }, { status: 503 });
  }
}
