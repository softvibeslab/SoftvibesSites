import type { NextRequest } from "next/server";

import {
  archiveArtifact,
  type ArtifactInput,
  updateArtifact,
} from "@/server/db/repository";
import {
  empty,
  errorResponse,
  ok,
  readJsonObject,
  requireSession,
} from "@/server/http/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSession(request, true);
    const body = await readJsonObject(request);
    const { id } = await context.params;
    return ok(await updateArtifact(id, body as ArtifactInput, session.userId));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSession(request, true);
    const { id } = await context.params;
    await archiveArtifact(id, session.userId);
    return empty();
  } catch (error) {
    return errorResponse(error);
  }
}
