import type { NextRequest } from "next/server";

import { getBootstrapData } from "@/server/db/repository";
import { errorResponse, ok, requireSession } from "@/server/http/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    return ok(await getBootstrapData(session.username, session.csrfToken));
  } catch (error) {
    return errorResponse(error);
  }
}
