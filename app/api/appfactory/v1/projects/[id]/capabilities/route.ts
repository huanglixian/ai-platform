import { withApiAuth } from "@/features/auth/api";
import { apiError,apiOk } from "@/lib/server/api-response"; import { bindCapability, getProject } from "@/app_factory/server/database"; import { listCapabilities } from "@/features/capabilities/server"; import fs from "node:fs/promises";
export const runtime="nodejs";
async function handleGET(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;const project=getProject(id);if(!project)return apiError("项目不存在",404);try{return apiOk(listCapabilities());}catch(e){return apiError(e instanceof Error?e.message:"能力查询失败",502);}}
async function handlePOST(r:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;const project=getProject(id);if(!project)return apiError("项目不存在",404);const body=await r.json() as {capabilityId?:string;version?:string};if(!body.capabilityId)return apiError("缺少 capabilityId",422);const binding=bindCapability(id,body.capabilityId,body.version);const appYaml=await fs.readFile(`${project.workspacePath}/app.yaml`,"utf8");const next=appYaml.replace(/capabilities:\s*\[\]/,`capabilities:\n  - ${body.capabilityId}`);await fs.writeFile(`${project.workspacePath}/app.yaml`,next);return apiOk(binding,{status:201});}

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);
