import { randomBytes } from "node:crypto";

import type { NextRequest } from "next/server";

import {
  createSessionToken,
  verifyPassword,
} from "@/server/auth/session";
import { findUserByUsername } from "@/server/db/repository";
import {
  ApiError,
  authenticationSecret,
  errorResponse,
  ok,
  readJsonObject,
  sessionCookieName,
} from "@/server/http/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    const username =
      typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (username.length === 0 || password.length === 0 || password.length > 500) {
      throw new ApiError(
        "INVALID_CREDENTIALS",
        "The username or password is invalid.",
        401,
      );
    }

    const user = await findUserByUsername(username);
    const valid =
      user !== undefined &&
      (await verifyPassword(password, user.password_salt, user.password_hash));
    if (!valid || user === undefined) {
      throw new ApiError(
        "INVALID_CREDENTIALS",
        "The username or password is invalid.",
        401,
      );
    }

    const csrfToken = randomBytes(24).toString("base64url");
    const sessionToken = await createSessionToken(
      {
        userId: user.id,
        username: user.username,
        csrfToken,
      },
      authenticationSecret(),
    );
    const response = ok({
      user: { username: user.username },
      csrfToken,
    });
    response.cookies.set(sessionCookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
