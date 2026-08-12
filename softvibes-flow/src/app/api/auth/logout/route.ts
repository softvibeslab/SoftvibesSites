import type { NextRequest } from "next/server";

import {
  errorResponse,
  ok,
  requireSession,
  sessionCookieName,
} from "@/server/http/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireSession(request, true);
    const response = ok({ loggedOut: true });
    response.cookies.set(sessionCookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
