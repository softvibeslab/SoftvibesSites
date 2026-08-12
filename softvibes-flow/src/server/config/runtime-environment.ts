import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseEnvironmentText } from "./parse-environment";

let attempted = false;

export function ensureRuntimeEnvironment(): void {
  if (attempted) {
    return;
  }

  try {
    const values = parseEnvironmentText(
      readFileSync(join(process.cwd(), ".env.production"), "utf8"),
    );
    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    attempted = true;
  } catch {
    // Standard platform variables remain primary; a later request may retry
    // when an archive deployment provisions the fallback file asynchronously.
  }
}
