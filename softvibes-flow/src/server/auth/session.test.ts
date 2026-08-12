import { describe, expect, it } from "vitest";

import {
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from "./session";

describe("authentication helpers", () => {
  it("hashes and verifies a password without storing plaintext", async () => {
    const passwordHash = await hashPassword("correct horse battery staple", "fixed-salt");

    expect(passwordHash).not.toContain("correct horse battery staple");
    await expect(
      verifyPassword("correct horse battery staple", "fixed-salt", passwordHash),
    ).resolves.toBe(true);
    await expect(
      verifyPassword("wrong", "fixed-salt", passwordHash),
    ).resolves.toBe(false);
  });

  it("signs a time-limited session token and rejects tampering", async () => {
    const secret = "test-secret-with-enough-entropy-for-signing";
    const token = await createSessionToken(
      {
        userId: "user-1",
        username: "roger",
        csrfToken: "csrf-1",
      },
      secret,
      new Date("2026-07-29T12:00:00.000Z"),
    );

    await expect(
      verifySessionToken(token, secret, new Date("2026-07-29T12:30:00.000Z")),
    ).resolves.toMatchObject({
      userId: "user-1",
      username: "roger",
      csrfToken: "csrf-1",
    });

    await expect(
      verifySessionToken(`${token}tampered`, secret),
    ).resolves.toBeNull();
  });
});
