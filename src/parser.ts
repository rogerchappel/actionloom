export function firstScalar(content: string, key: string): string | undefined {
  const matcher = new RegExp(`^\\s*${escapeRegex(key)}\\s*:\\s*(.+?)\\s*$`, "m");
  const match = content.match(matcher);
  if (!match) return undefined;
  return stripQuotes(match[1].replace(/#.*/, "").trim());
}

export function lineNumberOf(content: string, needle: string | RegExp): number | undefined {
  const lines = content.split(/\r?\n/);
  const index = lines.findIndex((line) => typeof needle === "string" ? line.includes(needle) : needle.test(line));
  return index === -1 ? undefined : index + 1;
}

export function countTopLevelMapEntries(content: string, key: string): number {
  const lines = content.split(/\r?\n/);
  const keyIndex = lines.findIndex((line) => new RegExp(`^${escapeRegex(key)}\\s*:`).test(line));
  if (keyIndex === -1) return 0;
  let count = 0;
  for (let index = keyIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\S/.test(line) && !line.startsWith("-")) break;
    if (/^\s{2}[A-Za-z0-9_-]+\s*:/.test(line)) count += 1;
  }
  return count;
}

export function blockText(content: string, key: string): string | undefined {
  const lines = content.split(/\r?\n/);
  const keyIndex = lines.findIndex((line) => new RegExp(`^${escapeRegex(key)}\\s*:`).test(line));
  if (keyIndex === -1) return undefined;
  const collected: string[] = [];
  for (let index = keyIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\S/.test(line) && !line.startsWith("-")) break;
    collected.push(line);
  }
  return collected.join("\n");
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, "");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
