import { apiError, apiOk } from "@/lib/server/api-response";
import { getPiSessionStatus } from "@/app_factory/types/session";
import { getModelProfile, type ModelProfileId } from "@/app_factory/server/model-profiles";
import { piSessionExists } from "@/app_factory/server/pi-session";
import { createSession, getProject, listSessions } from "@/app_factory/server/database";

export const runtime = "nodejs";

type SessionRow = {
  id: string;
  projectId: string;
  status: string;
  harness: string;
  title: string;
  modelProfileId: ModelProfileId;
  transcriptPath?: string | null;
  createdAt: string;
  updatedAt: string;
};

async function presentSession(session: SessionRow) {
  const hasPiSession = await piSessionExists(session.id);
  const modelProfile = getModelProfile(session.modelProfileId);
  return {
    id: session.id,
    projectId: session.projectId,
    status: session.status,
    harness: session.harness,
    title: session.title,
    modelProfileId: modelProfile.id,
    modelLabel: modelProfile.label,
    modelProvider: modelProfile.provider,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    piStatus: getPiSessionStatus({
      hasTranscript: Boolean(session.transcriptPath),
      hasPiSession,
    }),
  };
}

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!getProject(id)) return apiError("项目不存在", 404);
  const sessions = listSessions(id) as SessionRow[];
  return apiOk(await Promise.all(sessions.map(presentSession)));
}

export async function POST(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!getProject(id)) return apiError("项目不存在", 404);
  return apiOk(
    await presentSession(createSession(id) as SessionRow),
    { status: 201 },
  );
}
