import {
  createHmac,
  pbkdf2 as derivePassword,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const pbkdf2 = promisify(derivePassword);
const sessionDurationMs = 8 * 60 * 60 * 1000;

export interface SessionPayload {
  readonly userId: string;
  readonly username: string;
  readonly csrfToken: string;
  readonly expiresAt: string;
}

interface SessionInput {
  readonly userId: string;
  readonly username: string;
  readonly csrfToken: string;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const derived = await pbkdf2(password, salt, 210_000, 32, "sha256");
  return derived.toString("base64url");
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const actualHash = await hashPassword(password, salt);
  const actual = Buffer.from(actualHash);
  const expected = Buffer.from(expectedHash);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createSessionToken(
  input: SessionInput,
  secret: string,
  now = new Date(),
): Promise<string> {
  const payload: SessionPayload = {
    ...input,
    expiresAt: new Date(now.getTime() + sessionDurationMs).toISOString(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signPayload(encoded, secret)}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
  now = new Date(),
): Promise<SessionPayload | null> {
  const [encoded, signature, extra] = token.split(".");
  if (
    encoded === undefined ||
    signature === undefined ||
    extra !== undefined ||
    secret.length < 16
  ) {
    return null;
  }

  const expected = Buffer.from(signPayload(encoded, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;
    if (
      typeof payload.userId !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.csrfToken !== "string" ||
      typeof payload.expiresAt !== "string" ||
      new Date(payload.expiresAt).getTime() <= now.getTime()
    ) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}
