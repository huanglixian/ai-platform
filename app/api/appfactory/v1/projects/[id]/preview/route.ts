import { apiError,apiOk } from "@/lib/server/api-response"; import { getProject } from "@/app_factory/server/database"; import { getPreview,startPreview,stopPreview } from "@/app_factory/server/preview";
export const runtime="nodejs";
export async function GET(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;return apiOk(getPreview(id));}
export async function POST(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;const project=getProject(id);if(!project)return apiError("项目不存在",404);return apiOk(startPreview(id,project.workspacePath));}
export async function DELETE(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;return stopPreview(id)?apiOk({status:"stopped"}):apiError("Preview 未运行",404);}
