import { apiError, apiOk } from "@/lib/server/api-response";
import { getCapability } from "@/features/capabilities/server";
export const runtime = "nodejs";
export async function GET(_:Request,c:{params:Promise<{id:string}>}){const {id}=await c.params;const item=getCapability(id);return item?apiOk(item):apiError("能力不存在",404);}
