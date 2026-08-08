// Config loading / merging / persistence for pi-permission-modes.
// Layering: project rules (<cwd>/.pi/permission.json) are appended on top of
// user rules (~/.pi/permission.json). The active mode is always read from the
// user config (a session-level choice), while either file may declare rules.

import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

export type Mode = "full" | "ask" | "risky" | "readonly" | "custom";

export interface RuleSet {
  allow: string[];
  ask: string[];
  deny: string[];
}

export interface PermissionConfig {
  mode: Mode;
  rules: RuleSet;
  /** custom mode fallback when no rule matches (default: "allow") */
  defaultPolicy: "allow" | "ask" | "deny";
  /** approval dialog timeout in ms (default: 60000). Timeout resolves as deny. */
  approvalTimeoutMs: number;
}

const USER_CONFIG_PATH = join(homedir(), ".pi", "permission.json");
const PROJECT_CONFIG_PATH = join(process.cwd(), ".pi", "permission.json");

const DEFAULTS: PermissionConfig = {
  mode: "full",
  rules: { allow: [], ask: [], deny: [] },
  defaultPolicy: "allow",
  approvalTimeoutMs: 60000,
};

function mergeRuleSet(base: RuleSet, extra?: Partial<RuleSet>): RuleSet {
  return {
    allow: [...base.allow, ...(extra?.allow ?? [])],
    ask: [...base.ask, ...(extra?.ask ?? [])],
    deny: [...base.deny, ...(extra?.deny ?? [])],
  };
}

function readJsonSafe(file: string): Partial<PermissionConfig> | null {
  try {
    if (!existsSync(file)) return null;
    return JSON.parse(readFileSync(file, "utf8")) as Partial<PermissionConfig>;
  } catch {
    return null;
  }
}

let cached: PermissionConfig | null = null;

export function loadConfig(): PermissionConfig {
  if (cached) return cached;
  const user = readJsonSafe(USER_CONFIG_PATH) ?? {};
  const project = readJsonSafe(PROJECT_CONFIG_PATH) ?? {};

  const mode: Mode = ["full", "ask", "risky", "readonly", "custom"].includes(user.mode as string)
    ? (user.mode as Mode)
    : DEFAULTS.mode;

  cached = {
    mode,
    rules: mergeRuleSet(mergeRuleSet(DEFAULTS.rules, user.rules), project.rules),
    defaultPolicy: user.defaultPolicy ?? DEFAULTS.defaultPolicy,
    approvalTimeoutMs: user.approvalTimeoutMs ?? DEFAULTS.approvalTimeoutMs,
  };
  return cached;
}

export function reloadConfig(): PermissionConfig {
  cached = null;
  return loadConfig();
}

export function setMode(mode: Mode): PermissionConfig {
  const user = readJsonSafe(USER_CONFIG_PATH) ?? {};
  const next = { ...user, mode };
  writeFileSync(USER_CONFIG_PATH, `${JSON.stringify(next, null, 2)}\n`);
  return reloadConfig();
}

/** Add a rule (e.g. "Bash(rm *)") to the user config under the given level. */
export function addRule(level: keyof RuleSet, rule: string): PermissionConfig {
  const user = readJsonSafe(USER_CONFIG_PATH) ?? {};
  const rules = { ...(user.rules ?? {}) };
  rules[level] = [...(rules[level] ?? []), rule];
  writeFileSync(USER_CONFIG_PATH, `${JSON.stringify({ ...user, rules }, null, 2)}\n`);
  return reloadConfig();
}

export function ensureConfigDir(): void {
  mkdirSync(join(homedir(), ".pi"), { recursive: true });
  ensureLogDir();
}

function ensureLogDir(): void {
  const dir = join(homedir(), ".pi", "logs");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export { USER_CONFIG_PATH, PROJECT_CONFIG_PATH };
