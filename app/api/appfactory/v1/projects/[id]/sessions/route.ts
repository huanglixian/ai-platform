import { apiError,apiOk } from "@/lib/server/api-response"; import { projectService,sessionService } from "@/app_factory/server/services";
export const runtime="nodejs";
export async function GET(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;if(!projectService.get(id))return apiError("项目不存在",404);return apiOk(sessionService.list(id));}
export async function POST(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;if(!projectService.get(id))return apiError("项目不存在",404);return apiOk(sessionService.create(id),{status:201});}
