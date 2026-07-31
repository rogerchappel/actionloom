export interface YamlMapEntry {
  key: string;
  value: string;
  line: number;
  indent: number;
}

export interface YamlScalarLine {
  value: string;
  line: number;
}

export function firstScalar(content: string, key: string): string | undefined {
  const entry = topLevelField(content, key);
  return entry?.value ? stripQuotes(entry.value) : undefined;
}

export function lineNumberOf(content: string, needle: string | RegExp): number | undefined {
  const lines = content.split(/\r?\n/);
  const index = lines.findIndex((line) => typeof needle === "string" ? line.includes(needle) : needle.test(line));
  return index === -1 ? undefined : index + 1;
}

export function topLevelField(content: string, key: string): YamlMapEntry | undefined {
  return parseMapEntries(content).find((entry) => entry.indent === 0 && entry.key === key);
}

export function mapEntriesWithin(content: string, parent: YamlMapEntry): YamlMapEntry[] {
  const entries = parseMapEntries(content);
  const children = entries.filter((entry) => entry.line > parent.line && entry.indent > parent.indent && !hasEarlierBoundary(entries, parent, entry));
  if (children.length === 0) return [];
  const childIndent = Math.min(...children.map((entry) => entry.indent));
  return children.filter((entry) => entry.indent === childIndent);
}

export function topLevelMapEntries(content: string, key: string): YamlMapEntry[] {
  const parent = topLevelField(content, key);
  return parent ? mapEntriesWithin(content, parent) : [];
}

export function countTopLevelMapEntries(content: string, key: string): number {
  return topLevelMapEntries(content, key).length;
}

export function mapEntriesForKey(content: string, key: string): YamlMapEntry[] {
  return parseMapEntries(content, true).filter((entry) => entry.key === key);
}

export function scalarLinesForKey(content: string, key: string): YamlScalarLine[] {
  const lines = content.split(/\r?\n/);
  return mapEntriesForKey(content, key).flatMap((entry) => {
    if (!/^[|>][+-]?\d*$/.test(entry.value)) {
      return entry.value ? [{ value: entry.value, line: entry.line }] : [];
    }

    const scalarLines: YamlScalarLine[] = [];
    for (let index = entry.line; index < lines.length; index += 1) {
      const rawLine = lines[index];
      const indent = rawLine.match(/^ */)?.[0].length ?? 0;
      if (rawLine.trim() && indent <= entry.indent) break;
      const value = stripInlineComment(rawLine).trim();
      if (value) scalarLines.push({ value, line: index + 1 });
    }
    return scalarLines;
  });
}

export function blockText(content: string, key: string): string | undefined {
  const parent = topLevelField(content, key);
  if (!parent) return undefined;
  const lines = content.split(/\r?\n/);
  const nextTopLevel = parseMapEntries(content).find((entry) => entry.line > parent.line && entry.indent <= parent.indent);
  return lines.slice(parent.line, nextTopLevel ? nextTopLevel.line - 1 : lines.length).join("\n");
}

function parseMapEntries(content: string, includeSequenceEntries = false): YamlMapEntry[] {
  const entries: YamlMapEntry[] = [];
  const lines = content.split(/\r?\n/);
  let blockScalarIndent: number | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const indent = rawLine.match(/^ */)?.[0].length ?? 0;
    if (blockScalarIndent !== undefined) {
      if (rawLine.trim() === "" || indent > blockScalarIndent) continue;
      blockScalarIndent = undefined;
    }

    const line = stripInlineComment(rawLine);
    if (!line.trim()) continue;
    const match = line.match(includeSequenceEntries
      ? /^( *)(-\s+)?([A-Za-z0-9_.-]+)\s*:\s*(.*?)\s*$/
      : /^( *)()([A-Za-z0-9_.-]+)\s*:\s*(.*?)\s*$/);
    if (!match) continue;
    const value = match[4].trim();
    const entryIndent = match[1].length + (match[2]?.length ?? 0);
    entries.push({ key: match[3], value, line: index + 1, indent: entryIndent });
    if (/^[|>][+-]?\d*$/.test(value)) blockScalarIndent = match[1].length;
  }

  return entries;
}

function hasEarlierBoundary(entries: YamlMapEntry[], parent: YamlMapEntry, candidate: YamlMapEntry): boolean {
  return entries.some((entry) => entry.line > parent.line && entry.line < candidate.line && entry.indent <= parent.indent);
}

function stripInlineComment(line: string): string {
  let quote: "'" | '"' | undefined;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if ((character === "'" || character === '"') && line[index - 1] !== "\\") {
      quote = quote === character ? undefined : quote ?? character;
    }
    if (character === "#" && quote === undefined && (index === 0 || /\s/.test(line[index - 1]))) {
      return line.slice(0, index).trimEnd();
    }
  }
  return line;
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, "");
}
