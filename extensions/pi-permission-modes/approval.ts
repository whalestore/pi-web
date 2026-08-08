// Approval flow — aligned with Codex CLI's approval modal:
//   1. Yes, proceed
//   2. Yes, and don't ask again for commands that start with `X`  (adds a rule)
//   3. No, and tell pi what to do differently                      (free-text input)
// Timeout / cancel / UI failure resolves as deny (fail-safe).
//
// Transport (extension_ui_request):
//   TUI  — plain readable dialog (ctx.ui.select / ctx.ui.input native UI)
//   RPC  — select title carries a structured JSON payload prefixed with
//          "pi-permission:" so pi-web can render its kumo ApprovalPopup;
//          the follow-up feedback input uses the fixed title
//          "pi-permission-feedback".

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
  reasons?: string[];
  /** Short human description of the operation subject (e.g. the command). */
  subject: string;
}

export const FEEDBACK_TITLE = "pi-permission-feedback";

const OPT_PROCEED = "Yes, proceed";
const OPT_TELL = "No, and tell pi what to do differently";

function questionFor(toolName: string): string {
  switch (toolName) {
    case "bash":
      return "Would you like to run the following command?";
    case "write":
    case "edit":
      return "Allow writing to this file?";
    case "web_search":
    case "fetch_content":
    case "source_check":
      return "Allow this network operation?";
    default:
      return "Approve this operation?";
  }
}

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
  const inner = rule.slice(rule.indexOf("(") + 1, -1);
  const verb = toolName === "write" || toolName === "edit" ? "paths" : "commands";
  return `Yes, and don't ask again for ${verb} that start with \`${inner}\``;
}

export async function requestApproval(
  ui: ExtensionUIContext,
  mode: string,
  cfg: PermissionConfig,
  info: ApprovalInfo,
): Promise<ApprovalResult> {
  const labels = [
    OPT_PROCEED,
    rememberOptionLabel(info.toolName, info.target),
    OPT_TELL,
  ];
  const timeoutSec = Math.round(cfg.approvalTimeoutMs / 1000);

  const isRpc = mode === "rpc";
  const title = isRpc
    ? `pi-permission:${JSON.stringify({
        v: 1,
        tool: info.toolName,
        question: questionFor(info.toolName),
        subject: info.subject,
        reasons: info.reasons ?? [],
        labels,
        timeoutSec,
      })}`
    : `⚠ pi 请求权限: ${info.toolName}`;

  let choice: string | undefined;
  try {
    choice = await ui.select(title, labels, { timeout: cfg.approvalTimeoutMs });
  } catch {
    return { kind: "deny" };
  }
  if (!choice) return { kind: "deny" }; // timeout / cancel → fail-safe deny

  if (choice === OPT_PROCEED) return { kind: "allow-once" };
  if (choice !== OPT_TELL) {
    // remember option (exact label match, robust against RPC/TUI variations)
    return { kind: "allow-rule", rule: buildPrefixRule(info.toolName, info.target) };
  }

  // OPT_TELL: free-text instruction back to the agent
  let feedback: string | undefined;
  try {
    feedback = (await ui.input(FEEDBACK_TITLE, "告诉 pi 应该怎么做…", {
      timeout: cfg.approvalTimeoutMs,
    })) as string | undefined;
  } catch {
    feedback = undefined;
  }
  return { kind: "deny", feedback: feedback?.trim() || undefined };
}
