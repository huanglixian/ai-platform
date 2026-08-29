import { z } from "zod"; import { apiError,apiOk } from "@/lib/server/api-response"; import { jobService } from "@/app_factory/server/services";
export const runtime="nodejs"; const schema=z.object({projectId:z.string().min(1),kind:z.string().min(1),payload:z.unknown().optional()});
export function GET(request:Request){return apiOk(jobService.list(new URL(request.url).searchParams.get("projectId")??undefined));}
export async function POST(r:Request){const p=schema.safeParse(await r.json());if(!p.success)return apiError("任务字段校验失败",422,p.error.flatten());return apiOk(jobService.create(p.data),{status:201});}
