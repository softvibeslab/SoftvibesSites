import { describe, expect, it } from "vitest";

import { parseEnvironmentText } from "./parse-environment";

describe("runtime environment parser", () => {
  it("reads simple deployment values and ignores comments", () => {
    expect(
      parseEnvironmentText(`
        # Hostinger runtime
        DB_HOST=localhost
        DB_PASSWORD=value=with=equals
        INVALID KEY=ignored
      `),
    ).toEqual({
      DB_HOST: "localhost",
      DB_PASSWORD: "value=with=equals",
    });
  });

  it("reads archive-hosting files that contain escaped line separators", () => {
    expect(
      parseEnvironmentText(
        "DB_HOST=localhost\\nDB_NAME=softvibes_flow\\nAUTH_SECRET=secret",
      ),
    ).toEqual({
      DB_HOST: "localhost",
      DB_NAME: "softvibes_flow",
      AUTH_SECRET: "secret",
    });
  });
});
