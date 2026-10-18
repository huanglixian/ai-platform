import { withApiAuth } from "@/features/auth/api";
import { apiError, apiOk } from "@/lib/server/api-response";
import { listWorkflows, upsertWorkflow, workflowSchema } from "@/features/workflows/server";
export const runtime = "nodejs";
function handleGET(){ return apiOk(listWorkflows()); }
async function handlePOST(request:Request){ const parsed=workflowSchema.safeParse(await request.json()); if(!parsed.success)return apiError("业务流字段校验失败",422,parsed.error.flatten()); return apiOk(upsertWorkflow(undefined,parsed.data),{status:201}); }

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);
