// pi-permission-modes — Codex-style permission gate for pi.
//
// Modes: full (default) | ask | risky | readonly | custom
//   full     — everything allowed, no interception
//   ask      — every write/edit/bash/web tool call asks for approval
//   risky    — only risk-detector hits ask for approval
//   readonly — read-only tools allowed; writes and non-readonly bash blocked
//   custom   — rules-driven: deny > allow > ask, else defaultPolicy
//
// Rules (custom mode / any mode's rule set): "Tool(pattern)" glob rules in
// ~/.pi/permission.json and <cwd>/.pi/permission.json.
//
// Approval: ctx.ui.select dialog (TUI native / RPC via extension_ui_request,
// rendered by pi-web). Session-scoped "always allow" memory. Timeout → deny.

import type { ExtensionAPI, ToolCallEvent } from "@earendil-works/pi-coding-agent";
import {
  loadConfig,
  setMode,
  addRule,
  reloadConfig,
  ensureConfigDir,
  type Mode,
  type RuleSet,
} from "./config.ts";
import { matchRules, normalizeToolForRules } from "./rules.ts";
import { detectBashRisk, detectPathRisk } from "./risk-detector.ts";
import {
  requestApproval,
  hasMemorizedAllow,
  memorizeAllow,
  forgetAll,
  memoryEntries,
  type ApprovalInfo,
  type ApprovalResult,
} from "./approval.ts";
import { audit, recentAudit } from "./audit.ts";

// ---------- tool classification ----------

const READ_TOOLS = new Set(["read", "grep", "find", "ls", "get_search_content"]);
const WRITE_TOOLS = new Set(["write", "edit"]);
const WEB_TOOLS = new Set(["web_search", "fetch_content", "source_check"]);
// collaboration/control tools are never gated (they are the approval channel)
const NEVER_GATE = new Set(["ask_question"]);

type ToolKind = "read" | "write" | "bash" | "web" | "other";

function kindOf(toolName: string): ToolKind {
  if (READ_TOOLS.has(toolName)) return "read";
  if (WRITE_TOOLS.has(toolName)) return "write";
  if (toolName === "bash") return "bash";
  if (WEB_TOOLS.has(toolName)) return "web";
  return "other";
}

// ---------- target / summary extraction ----------

function extractTarget(toolName: string, input: Record<string, unknown>): string {
  switch (toolName) {
    case "bash": {
      const cmd = String(input.command ?? "");
      return cmd.length > 120 ? `${cmd.slice(0, 120)}…` : cmd;
    }
    case "write":
    case "edit":
      return String(input.path ?? input.filePath ?? "");
    case "web_search":
    case "source_check":
      return String(input.query ?? input.queries ?? input.claim ?? "");
    case "fetch_content":
      return String(input.url ?? input.urls ?? "");
    default:
      return JSON.stringify(input).slice(0, 120);
  }
}

function summarizeToolCall(toolName: string, input: Record<string, unknown>): string {
  switch (toolName) {
    case "bash":
      return `命令: ${String(input.command ?? "").slice(0, 200)}`;
    case "write":
      return `写入文件: ${String(input.path ?? "")}`;
    case "edit":
      return `编辑文件: ${String(input.path ?? "")}`;
    case "web_search":
      return `联网搜索: ${String(input.query ?? input.queries ?? "")}`;
    case "fetch_content":
      return `抓取内容: ${String(input.url ?? input.urls ?? "")}`;
    case "source_check":
      return `事实核验: ${String(input.claim ?? "")}`;
    default:
      return `调用工具 ${toolName}: ${JSON.stringify(input).slice(0, 200)}`;
  }
}

// ---------- decision ----------

interface Decision {
  action: "allow" | "ask" | "deny";
  reasons: string[];
}

const ALLOW_DECISION: Decision = { action: "allow", reasons: [] };

function decide(mode: Mode, kind: ToolKind, toolName: string, target: string, input: Record<string, unknown>): Decision {
  if (mode === "full") return ALLOW_DECISION;
  if (kind === "other" || NEVER_GATE.has(toolName)) return ALLOW_DECISION;

  // custom mode: rule table first (deny > allow > ask)
  if (mode === "custom") {
    const cfg = loadConfig();
    const hit = matchRules(cfg.rules, normalizeToolForRules(toolName), target);
    if (hit) return { action: hit, reasons: [`自定义规则: ${hit} 命中`] };
    return cfg.defaultPolicy === "allow"
      ? ALLOW_DECISION
      : { action: cfg.defaultPolicy, reasons: ["自定义模式默认策略"] };
  }

  if (mode === "readonly") {
    if (kind === "read") return ALLOW_DECISION;
    if (kind === "bash" && isReadonlyCommand(target)) return ALLOW_DECISION;
    return { action: "deny", reasons: ["只读模式：禁止写操作"] };
  }

  if (mode === "ask") {
    if (kind === "read") return ALLOW_DECISION;
    const label =
      kind === "write" ? "编辑文件" : kind === "bash" ? "执行命令" : "联网操作";
    return { action: "ask", reasons: [`ask 模式：${label} 需要批准`] };
  }

  // risky mode
  const reasons: string[] = [];
  if (kind === "bash") {
    reasons.push(...detectBashRisk(target).reasons);
  } else if (kind === "write") {
    reasons.push(...detectPathRisk(target, process.cwd()).reasons);
  } else if (kind === "web") {
    reasons.push(...detectWebRiskLocal(target));
  }
  return reasons.length ? { action: "ask", reasons } : ALLOW_DECISION;
}

function detectWebRiskLocal(target: string): string[] {
  // web lookups are read-only by nature; risky mode lets them through.
  return [];
}

const READONLY_CMD_RE =
  /^(?:git\s+(?:status|log|diff|show|branch|remote|rev-parse|ls-files|check-ignore)|(?:ls|pwd|cat|head|tail|wc|grep|find|echo)\b|true|false)/;

function isReadonlyCommand(command: string): boolean {
  const trimmed = command.trim();
  if (!trimmed) return true;
  if (/[|&;]\s*(?:>|>>|te?e|sed\s+-i|awk\s*[^|]*>)/.test(trimmed)) return false;
  if (/[>][>]?/.test(trimmed)) return false;
  return READONLY_CMD_RE.test(trimmed);
}

// ---------- extension entry ----------

export default function (pi: ExtensionAPI): void {
  ensureConfigDir();

  pi.on("tool_call", async (event: ToolCallEvent, ctx) => {
    const cfg = loadConfig();
    if (cfg.mode === "full") return;

    const toolName = event.toolName;
    const kind = kindOf(toolName);
    const input = (event.input ?? {}) as Record<string, unknown>;
    const target = extractTarget(toolName, input);

    // rule table applies in every non-full mode (allow rules short-circuit)
    const ruleHit = matchRules(cfg.rules, normalizeToolForRules(toolName), target);
    if (ruleHit === "deny") {
      audit({ mode: cfg.mode, toolName, target, decision: "deny", reason: `规则拒绝: ${target}` });
      return { block: true, reason: `权限拒绝：自定义规则禁止该操作（${toolName}: ${target.slice(0, 100)}）` };
    }
    if (ruleHit === "allow") return;

    const decision = decide(cfg.mode, kind, toolName, target, input);
    if (decision.action === "allow") return;
    if (decision.action === "deny") {
      audit({ mode: cfg.mode, toolName, target, decision: "deny", reason: decision.reasons.join("；") });
      return { block: true, reason: `权限拒绝：${decision.reasons.join("；")}（${toolName}: ${target.slice(0, 100)}）` };
    }

    // ask
    const memKey = memoryKeyFor(toolName, target);
    if (hasMemorizedAllow(toolName, target)) {
      audit({ mode: cfg.mode, toolName, target, decision: "allow", reason: "会话记忆（始终允许）" });
      return;
    }

    const info: ApprovalInfo = {
      toolName,
      target,
      summary: summarizeToolCall(toolName, input),
      reason: decision.reasons.join("；") || "需要批准",
    };
    audit({ mode: cfg.mode, toolName, target, decision: "ask", reason: info.reason });

    const choice: ApprovalResult = await requestApproval(ctx.ui, cfg, info);

    if (choice.kind === "allow-rule") {
      // Codex-style: remember this target prefix as an allow rule (persisted)
      addRule("allow", choice.rule);
      reloadConfig();
      audit({ mode: cfg.mode, toolName, target, decision: "user-allow", reason: `记忆规则: ${choice.rule}` });
      ctx.ui.notify(`已添加规则 allow: ${choice.rule}`, "info");
      return;
    }
    if (choice.kind === "allow-once") {
      audit({ mode: cfg.mode, toolName, target, decision: "user-allow", reason: "允许一次" });
      return;
    }
    // deny (optionally with feedback)
    audit({ mode: cfg.mode, toolName, target, decision: "user-deny", reason: choice.feedback ?? "用户拒绝" });
    return {
      block: true,
      reason: choice.feedback
        ? `用户拒绝了该操作并给出指示：${choice.feedback}`
        : `用户拒绝了该操作（${toolName}）。请调整方案：${decision.reasons.join("；")}`,
    };
  });

  pi.registerCommand("permission", {
    description: "权限门禁：查看/切换模式，管理规则与会话记忆",
    handler: async (args, ctx) => {
      const [cmd, ...rest] = (args ?? "").trim().split(/\s+/);
      const arg = rest.join(" ").trim();

      if (!cmd) {
        const cfg = loadConfig();
        const entries = memoryEntries();
        const lines = [
          `当前模式: ${cfg.mode}`,
          `规则: allow ${cfg.rules.allow.length} / ask ${cfg.rules.ask.length} / deny ${cfg.rules.deny.length}`,
          `会话记忆: ${entries.length} 条`,
          `默认策略(custom): ${cfg.defaultPolicy}`,
          "",
          "用法: /permission <full|ask|risky|readonly|custom>",
          "      /permission allow|ask|deny <Tool(pattern)>",
          "      /permission forget | log",
        ];
        ctx.ui.notify(lines.join("\n"), "info");
        return;
      }

      const mode: Mode | undefined = ["full", "ask", "risky", "readonly", "custom"].includes(cmd)
        ? (cmd as Mode)
        : undefined;
      if (mode) {
        setMode(mode);
        ctx.ui.notify(`权限模式已切换为 ${mode}`, "info");
        return;
      }

      if ((cmd === "allow" || cmd === "ask" || cmd === "deny") && arg) {
        addRule(cmd, arg);
        ctx.ui.notify(`已添加规则 ${cmd}: ${arg}`, "info");
        return;
      }

      if (cmd === "forget") {
        const n = forgetAll();
        ctx.ui.notify(`已清除 ${n} 条会话审批记忆`, "info");
        return;
      }

      if (cmd === "log") {
        const entries = recentAudit(20);
        if (!entries.length) {
          ctx.ui.notify("暂无审计记录", "info");
          return;
        }
        ctx.ui.notify(
          entries
            .map((e) => `${e.ts.slice(11, 19)} [${e.decision}] ${e.toolName} ${e.target.slice(0, 60)}`)
            .join("\n"),
          "info",
        );
        return;
      }

      ctx.ui.notify(`未知命令: ${cmd}\n用法: /permission <mode> | allow|ask|deny <规则> | forget | log`, "warning");
    },
  });
}

function memoryKeyFor(toolName: string, target: string): string {
  return `${toolName}\u0000${target}`;
}

export { loadConfig as _reloadForTests };
export type { Mode, RuleSet };
