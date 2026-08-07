// Approval flow — aligned with Codex CLI's approval modal:
//   1. Yes, proceed
//   2. Yes, and don't ask again for commands that start with `X`  (adds a rule)
//   3. No, and tell pi what to do differently                      (free-text input)
// Timeout / cancel / UI failure resolves as deny (fail-safe).
// Works in TUI and RPC modes (ctx.ui.select / ctx.ui.input map to
// extension_ui_request which pi-web renders).

import type { ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import type { PermissionConfig } from "./config.ts";

export type ApprovalResult =
  | { kind: "allow-once" }
  | { kind: "allow-rule"; rule: string }
  | { kind: "deny"; feedback?: string };

export interface ApprovalInfo {
  toolName: string;
  target: string;
  summary: string;
  reason: string;
  /** Short human description of the operation subject (e.g. the command). */
  subject: string;
}

const OPT_PROCEED = "Yes, proceed";
const OPT_REMEMBER = "Yes, and don't ask again for this in this session";
const OPT_TELL = "No, and tell pi what to do differently";

/**
 * Build a glob rule that matches targets starting with the given prefix,
 * mirroring Codex's execpolicy prefix rules: "Bash(echo hello world*)".
 */
export function buildPrefixRule(toolName: string, target: string): string {
  const ruleTool = toolName === "web_search" || toolName === "fetch_content" || toolName === "source_check"
    ? "web"
    : toolName;
  const maxPrefix = 60;
  const prefix = target.slice(0, maxPrefix).replace(/[()]/g, "\\$&").trim();
  return `${ruleTool.charAt(0).toUpperCase()}${ruleTool.slice(1)}(${prefix}*)`;
}

/** Longer label shown for the remember option, Codex style. */
export function rememberOptionLabel(toolName: string, target: string): string {
  const rule = buildPrefixRule(toolName, target);
  // strip the "Tool(" wrapper for display
  const inner = rule.slice(rule.indexOf("(") + 1, -1);
  return `Yes, and don't ask again for commands that start with \`${inner}\``;
}

export async function requestApproval(
  ui: ExtensionUIContext,
  cfg: PermissionConfig,
  info: ApprovalInfo,
): Promise<ApprovalResult> {
  const rememberLabel = rememberOptionLabel(info.toolName, info.target);

  const title = `pi 请求权限: ${info.toolName}`;
  const options = [OPT_PROCEED, rememberLabel, OPT_TELL];

  let choice: string | undefined;
  try {
    choice = await ui.select(title, options, { timeout: cfg.approvalTimeoutMs });
  } catch {
    return { kind: "deny" };
  }
  if (!choice) return { kind: "deny" }; // timeout / cancel → fail-safe deny

  if (choice === OPT_PROCEED) return { kind: "allow-once" };

  if (choice === OPT_REMEMBER || choice === rememberLabel) {
    return { kind: "allow-rule", rule: buildPrefixRule(info.toolName, info.target) };
  }

  // OPT_TELL: free-text instruction back to the agent
  let feedback: string | undefined;
  try {
    feedback = (await ui.input("告诉 pi 应该怎么做（将作为反馈发给 agent）:", "", {
      timeout: cfg.approvalTimeoutMs,
    })) as string | undefined;
  } catch {
    feedback = undefined;
  }
  return { kind: "deny", feedback: feedback?.trim() || undefined };
}
