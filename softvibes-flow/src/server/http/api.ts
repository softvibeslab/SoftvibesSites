import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifySessionToken, type SessionPayload } from "@/server/auth/session";
import { ensureRuntimeEnvironment } from "@/server/config/runtime-environment";
import { RepositoryError } from "@/server/db/repository";

export const sessionCookieName = "softvibes_session";

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function authenticationSecret(): string {
  ensureRuntimeEnvironment();
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return secret;
}

export async function requireSession(
  request: NextRequest,
  mutation = false,
): Promise<SessionPayload> {
  const token = request.cookies.get(sessionCookieName)?.value;
  if (token === undefined) {
    throw new ApiError("UNAUTHENTICATED", "Authentication is required.", 401);
  }
  const session = await verifySessionToken(token, authenticationSecret());
  if (session === null) {
    throw new ApiError("UNAUTHENTICATED", "The session is invalid or expired.", 401);
  }
  if (
    mutation &&
    request.headers.get("x-csrf-token") !== session.csrfToken
  ) {
    throw new ApiError("INVALID_CSRF", "The security token is invalid.", 403);
  }
  return session;
}

export async function readJsonObject(
  request: NextRequest,
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError("INVALID_CONTENT_TYPE", "JSON content is required.", 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("INVALID_JSON", "The request body is not valid JSON.", 400);
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError("INVALID_BODY", "A JSON object is required.", 422);
  }
  return body as Record<string, unknown>;
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function empty(status = 204): NextResponse {
  return new NextResponse(null, { status });
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError || error instanceof RepositoryError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  console.error("Unhandled API error", error);
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "The operation could not be completed.",
      },
    },
    { status: 500 },
  );
}
