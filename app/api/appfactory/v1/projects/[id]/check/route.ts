import { apiError,apiOk } from "@/lib/server/api-response"; import { getProject,listCapabilityBindings } from "@/app_factory/server/database"; import { validateProject } from "@/app_factory/contracts/validator";
export const runtime="nodejs";
export async function POST(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;const project=getProject(id);if(!project)return apiError("项目不存在",404);return apiOk(await validateProject(project.workspacePath,{boundCapabilityIds:listCapabilityBindings(id).map((binding)=>binding.capabilityId)}));}
