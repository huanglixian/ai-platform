import { apiError, apiOk } from "@/lib/server/api-response";
import { listWorkflows, upsertWorkflow, workflowSchema } from "@/features/workflows/server";
export const runtime = "nodejs";
export function GET(){ return apiOk(listWorkflows()); }
export async function POST(request:Request){ const parsed=workflowSchema.safeParse(await request.json()); if(!parsed.success)return apiError("业务流字段校验失败",422,parsed.error.flatten()); return apiOk(upsertWorkflow(undefined,parsed.data),{status:201}); }
