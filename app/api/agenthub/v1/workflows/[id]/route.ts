import { apiError, apiOk } from "@/lib/server/api-response";
import { archiveWorkflow, getWorkflow, upsertWorkflow, workflowSchema } from "@/features/workflows/server";
export const runtime = "nodejs";
export async function GET(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;const item=getWorkflow(id);return item?apiOk(item):apiError("业务流不存在",404);}
export async function PUT(r:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;const p=workflowSchema.safeParse(await r.json());if(!p.success)return apiError("业务流字段校验失败",422,p.error.flatten());const item=upsertWorkflow(id,p.data);return item?apiOk(item):apiError("保存失败",500);}
export async function DELETE(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;return archiveWorkflow(id)?apiOk({id,archived:true}):apiError("业务流不存在",404);}
