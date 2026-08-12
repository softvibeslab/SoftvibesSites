import { getDatabaseCounts } from "@/server/db/database";
import { errorResponse, ok } from "@/server/http/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const counts = await getDatabaseCounts();
    return ok({
      service: "softvibes-flow",
      status: "ok",
      database: "connected",
      counts,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
