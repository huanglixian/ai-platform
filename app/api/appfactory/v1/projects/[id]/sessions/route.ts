import { apiError,apiOk } from "@/lib/server/api-response"; import { createSession,getProject,listSessions } from "@/app_factory/server/database";
export const runtime="nodejs";
export async function GET(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;return apiOk(listSessions(id));}
export async function POST(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;if(!getProject(id))return apiError("项目不存在",404);return apiOk(createSession(id),{status:201});}
