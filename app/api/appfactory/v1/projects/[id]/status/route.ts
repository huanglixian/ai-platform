import { apiError,apiOk } from "@/lib/server/api-response"; import { getProject } from "@/app_factory/server/database"; import { getLatestBuild,getLatestDeployment,getLatestRelease } from "@/app_factory/server/database"; import { getPreview } from "@/app_factory/server/preview";
export const runtime="nodejs";
export async function GET(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;if(!getProject(id))return apiError("项目不存在",404);return apiOk({preview:getPreview(id),build:getLatestBuild(id),release:getLatestRelease(id),deployment:getLatestDeployment(id)});}
