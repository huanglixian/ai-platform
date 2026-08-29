import { z } from "zod";

export const agentHubTransportVersion = "v1" as const;

export const apiSuccessSchema = z.object({ data: z.unknown() });
export const apiErrorSchema = z.object({
  error: z.object({ message: z.string(), details: z.unknown().optional() }),
});

export const apiResponseHeaders = z.object({
  "X-AgentHub-API-Version": z.literal(agentHubTransportVersion),
  "X-Request-Id": z.string().min(1),
  "X-Request-Actor": z.enum(["local-user", "system"]),
});
