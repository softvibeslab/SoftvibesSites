import { describe, expect, it } from "vitest";

import { inventorySeed } from "./inventory-seed";

const credentialKeyPattern =
  /(^|_)(api[_-]?key|authorization|bearer|clave|contrase(?:ña|na)|password|passwd|secret|token|user(?:name)?|usuario)(_|$)/i;
const credentialValuePattern =
  /(?:api[_-]?key|authorization|bearer|clave|contrase(?:ña|na)|password|passwd|secret|token|user(?:name)?|usuario)\s*[:=]\s*\S+/i;

function visit(value: unknown, path = "inventorySeed"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => visit(entry, `${path}[${index}]`));
    return;
  }

  if (value !== null && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      expect(key, `${path}.${key} must not be a credential field`).not.toMatch(
        credentialKeyPattern,
      );
      visit(entry, `${path}.${key}`);
    }
    return;
  }

  if (typeof value === "string") {
    expect(
      value,
      `${path} must not contain an inline credential`,
    ).not.toMatch(credentialValuePattern);
  }
}

describe("workspace inventory seed", () => {
  it("contains no credential-like keys or inline credentials", () => {
    visit(inventorySeed);
  });

  it("uses only secure public URLs", () => {
    for (const project of inventorySeed) {
      for (const artifact of project.artifacts) {
        if (artifact.publicUrl !== null) {
          expect(new URL(artifact.publicUrl).protocol).toBe("https:");
        }
      }
    }
  });
});
