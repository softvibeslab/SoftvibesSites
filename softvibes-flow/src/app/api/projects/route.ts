import type { NextRequest } from "next/server";

import { createProject, type ProjectInput } from "@/server/db/repository";
import {
  errorResponse,
  ok,
  readJsonObject,
  requireSession,
} from "@/server/http/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request, true);
    const body = await readJsonObject(request);
    return ok(await createProject(body as ProjectInput, session.userId), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
