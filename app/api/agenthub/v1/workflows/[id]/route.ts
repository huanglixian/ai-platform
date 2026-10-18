import { withApiAuth } from "@/features/auth/api";
import { apiError, apiOk } from "@/lib/server/api-response";
import { archiveWorkflow, getWorkflow, upsertWorkflow, workflowSchema } from "@/features/workflows/server";
export const runtime = "nodejs";
async function handleGET(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;const item=getWorkflow(id);return item?apiOk(item):apiError("业务流不存在",404);}
async function handlePUT(r:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;const p=workflowSchema.safeParse(await r.json());if(!p.success)return apiError("业务流字段校验失败",422,p.error.flatten());const item=upsertWorkflow(id,p.data);return item?apiOk(item):apiError("保存失败",500);}
async function handleDELETE(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;return archiveWorkflow(id)?apiOk({id,archived:true}):apiError("业务流不存在",404);}

export const GET = withApiAuth(handleGET);
export const PUT = withApiAuth(handlePUT);
export const DELETE = withApiAuth(handleDELETE);
