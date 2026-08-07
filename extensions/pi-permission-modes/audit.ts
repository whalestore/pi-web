// Audit log: every gate decision is appended as one JSON line to
// ~/.pi/logs/permission-YYYY-MM-DD.log

import { homedir } from "node:os";
import { join } from "node:path";
import { appendFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";

export interface AuditEntry {
  ts: string;
  mode: string;
  toolName: string;
  target: string;
  decision: "allow" | "ask" | "deny" | "user-allow" | "user-deny" | "timeout-deny";
  reason?: string;
}

function logPath(): string {
  const day = new Date().toISOString().slice(0, 10);
  return join(homedir(), ".pi", "logs", `permission-${day}.log`);
}

export function audit(entry: Omit<AuditEntry, "ts">): void {
  try {
    const dir = join(homedir(), ".pi", "logs");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    appendFileSync(logPath(), `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`);
  } catch {
    // audit must never break the gate
  }
}

/** Read today's audit entries (most recent first). */
export function recentAudit(limit = 20): AuditEntry[] {
  try {
    const text = readFileSync(logPath(), "utf8");
    const lines = text.split("\n").filter(Boolean).slice(-limit);
    return lines.map((l) => {
      try {
        return JSON.parse(l) as AuditEntry;
      } catch {
        return null;
      }
    }).filter(Boolean) as AuditEntry[];
  } catch {
    return [];
  }
}
