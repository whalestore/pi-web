// Rule engine: parses `Tool(pattern)` rules (Codex config.toml style) and
// matches tool invocations. Precedence: deny > allow > ask. Within the same
// level the most specific (longest literal prefix) pattern wins.

import type { RuleSet } from "./config.ts";

export interface ParsedRule {
  raw: string;
  tool: string;
  pattern: string;
  regex: RegExp;
}

const RULE_RE = /^([A-Za-z][A-Za-z0-9_]*)\s*\(\s*(.*?)\s*\)$/;

function globToRegex(glob: string): RegExp {
  let out = "^";
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === "*") {
      // Codex semantics: `*` matches any character sequence (including /).
      // `**` is accepted as the same (no directory-aware behavior needed
      // for command/path matching).
      out += ".*";
      if (glob[i + 1] === "*") i++;
    } else if (ch === "?") {
      out += ".";
    } else if ("\\^$.|+()[]{}".includes(ch)) {
      out += `\\${ch}`;
    } else {
      out += ch;
    }
  }
  out += "$";
  return new RegExp(out, "i");
}

export function parseRule(raw: string): ParsedRule | null {
  const m = RULE_RE.exec(raw.trim());
  if (!m) return null;
  const tool = m[1].toLowerCase();
  const pattern = m[2];
  try {
    return { raw: raw.trim(), tool, pattern, regex: globToRegex(pattern) };
  } catch {
    return null;
  }
}

function compile(rules: string[]): ParsedRule[] {
  const out: ParsedRule[] = [];
  for (const raw of rules) {
    const parsed = parseRule(raw);
    if (parsed) out.push(parsed);
  }
  // Most specific first: longer literal patterns win within a level.
  return out.sort((a, b) => b.pattern.length - a.pattern.length);
}

export type RuleMatch = "allow" | "ask" | "deny" | undefined;

/** Match toolName + target string against a rule set. */
export function matchRules(rules: RuleSet, toolName: string, target: string): RuleMatch {
  const compiled = {
    allow: compile(rules.allow),
    ask: compile(rules.ask),
    deny: compile(rules.deny),
  };

  // deny wins over everything
  for (const rule of compiled.deny) {
    if (rule.tool === toolName && rule.regex.test(target)) return "deny";
  }
  for (const rule of compiled.allow) {
    if (rule.tool === toolName && rule.regex.test(target)) return "allow";
  }
  for (const rule of compiled.ask) {
    if (rule.tool === toolName && rule.regex.test(target)) return "ask";
  }
  return undefined;
}

export function normalizeToolForRules(toolName: string): string {
  // Map built-in + extension tools to Codex-style categories
  switch (toolName) {
    case "bash":
      return "bash";
    case "write":
    case "edit":
      return toolName;
    case "web_search":
    case "fetch_content":
    case "source_check":
      return "web";
    default:
      return toolName;
  }
}
