export function parseEnvironmentText(
  source: string,
): Readonly<Record<string, string>> {
  const values: Record<string, string> = {};
  const normalizedSource = source
    .replaceAll("\\r\\n", "\n")
    .replaceAll("\\n", "\n");

  for (const rawLine of normalizedSource.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      continue;
    }
    values[key] = line.slice(separator + 1).trim();
  }

  return values;
}
