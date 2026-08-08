"use client";

// ApprovalPopup — kumo 风格审批弹窗，贴在 ChatInput 输入框上方。
// 由 pi-permission-modes 扩展的 extension_ui_request 驱动：
//   select (title 以 "pi-permission:" 开头) → 选项阶段（3 个 Codex 风格决策）
//   input  (title === "pi-permission-feedback") → 反馈输入阶段（拒绝 + 告诉 agent 怎么做）
// 协议细节见 extensions/pi-permission-modes/approval.ts。

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Input } from "@/components/ui";
import type { ExtensionUiRequest } from "@/lib/types";

/** 与 ChatWindow/useAgentSession 的 dialog 请求类型一致（select/confirm/input/editor） */
export type ApprovalDialogRequest = Extract<ExtensionUiRequest, { method: "select" | "confirm" | "input" | "editor" }>;

export type ApprovalRespond = (
  request: ApprovalDialogRequest,
  response: { value: string } | { confirmed: boolean } | { cancelled: true },
) => void;

interface PermissionPayload {
  v?: number;
  tool?: string;
  question?: string;
  subject?: string;
  reasons?: string[];
  labels?: string[];
  timeoutSec?: number;
}

const FEEDBACK_TITLE = "pi-permission-feedback";

export function parsePermissionPayload(title: string | undefined): PermissionPayload | null {
  if (!title || !title.startsWith("pi-permission:")) return null;
  try {
    return JSON.parse(title.slice("pi-permission:".length)) as PermissionPayload;
  } catch {
    return null;
  }
}

export function isPermissionSelect(request: ExtensionUiRequest | null | undefined): boolean {
  return request?.method === "select" && !!parsePermissionPayload(request.title);
}

export function isPermissionFeedback(request: ExtensionUiRequest | null | undefined): boolean {
  return request?.method === "input" && request.title === FEEDBACK_TITLE;
}

/** 将选项文本里的 `反引号片段` 拆成 text + code 片段。 */
function splitLabel(label: string): Array<{ text: string; code: boolean }> {
  const parts: Array<{ text: string; code: boolean }> = [];
  const re = /`([^`]*)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(label)) !== null) {
    if (m.index > last) parts.push({ text: label.slice(last, m.index), code: false });
    parts.push({ text: m[1], code: true });
    last = m.index + m[0].length;
  }
  if (last < label.length) parts.push({ text: label.slice(last), code: false });
  return parts;
}

export function ApprovalPopup({
  request,
  onRespond,
}: {
  request: ExtensionUiRequest;
  onRespond: ApprovalRespond;
}) {
  const [phase, setPhase] = useState<"options" | "feedback">(
    request.method === "input" ? "feedback" : "options",
  );
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 请求类型切换：select → options，feedback input → feedback
  useEffect(() => {
    if (request.method === "input") {
      setPhase("feedback");
    } else {
      setPhase("options");
    }
  }, [request]);

  useEffect(() => {
    if (phase === "feedback") {
      // 输入框渲染后再聚焦
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [phase]);

  const payload = useMemo(
    () => (request.method === "select" ? parsePermissionPayload(request.title) : null),
    [request],
  );

  const timeoutText = payload?.timeoutSec
    ? ` · ${payload.timeoutSec}s 无响应将自动拒绝`
    : "";

  const handlePick = useCallback(
    (index: number) => {
      const labels = payload?.labels;
      if (!labels || !request || request.method !== "select") return;
      const value = labels[index];
      if (!value) return;
      if (index === 2) {
        // 选项 3：拒绝并告诉 agent 怎么做 → 响应 select，随后扩展会发 feedback input 请求
        setPhase("feedback");
        onRespond(request, { value });
        return;
      }
      onRespond(request, { value });
    },
    [payload, request, onRespond],
  );

  const handleSubmitFeedback = useCallback(() => {
    if (request.method !== "input") return;
    onRespond(request, { value: feedback.trim() });
  }, [request, feedback, onRespond]);

  if (request.method === "select" && !payload) return null;

  const isDeniedStyle = request.method === "input";
  const toolTag = payload?.tool ?? "tool";

  return (
    <div
      style={{
        border: `1px solid ${isDeniedStyle
          ? "color-mix(in srgb, var(--color-kumo-badge-red) 40%, var(--color-kumo-line))"
          : "var(--color-kumo-line)"}`,
        borderRadius: 12,
        background: "var(--color-kumo-base)",
        boxShadow: "0 -2px 16px rgba(0,0,0,0.06), 0 12px 32px -8px rgba(0,0,0,0.18)",
        marginBottom: 8,
        padding: "14px 16px 12px",
      }}
      role="dialog"
      aria-modal="false"
      aria-label="权限审批"
    >
      {/* 标题行：Badge + 问题 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Badge variant={isDeniedStyle ? "error" : "warning"}>
          {isDeniedStyle ? "⛔ 已拒绝" : "⚠ 需要批准"}
        </Badge>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--color-kumo-default)",
          }}
        >
          {isDeniedStyle ? "Tell pi what to do differently" : (payload?.question ?? "Approve this operation?")}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 400,
              marginLeft: 8,
              padding: "1px 6px",
              borderRadius: 5,
              border: "1px solid var(--color-kumo-line)",
              background: "var(--color-kumo-tint)",
              color: "var(--color-kumo-subtle)",
            }}
          >
            {toolTag}
          </span>
        </span>
      </div>

      {/* Reason */}
      {!isDeniedStyle && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            fontSize: 12.5,
            color: "var(--color-kumo-subtle)",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--color-kumo-badge-orange)",
              flexShrink: 0,
            }}
          />
          {(payload?.reasons?.length ? payload.reasons.join(" · ") : "需要批准") + timeoutText}
        </div>
      )}

      {/* 操作对象（命令/路径） */}
      {payload?.subject ? (
        <div
          style={{
            background: "var(--color-kumo-tint)",
            border: "1px solid var(--color-kumo-line)",
            borderRadius: 8,
            padding: "9px 12px",
            fontFamily: "var(--font-mono)",
            fontSize: 12.5,
            color: "var(--color-kumo-default)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: isDeniedStyle ? 0 : 12,
          }}
        >
          {payload.tool === "bash" && (
            <span style={{ color: "var(--color-kumo-brand)", fontWeight: 700, marginRight: 7 }}>$</span>
          )}
          {payload.subject}
        </div>
      ) : null}

      {/* 选项阶段：3 个 Codex 风格决策 */}
      {phase === "options" && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 4 }}>
            {(payload?.labels ?? []).map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePick(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "7px 12px",
                  border: i === 0 ? "1px solid var(--color-kumo-brand)" : "1px solid transparent",
                  borderRadius: 8,
                  background:
                    i === 0
                      ? "color-mix(in srgb, var(--color-kumo-brand) 8%, var(--color-kumo-base))"
                      : "transparent",
                  color: i === 0 ? "var(--color-kumo-default)" : "var(--color-kumo-subtle)",
                  fontSize: 13,
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.1s, border-color 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (i !== 0) {
                    e.currentTarget.style.background = "var(--color-kumo-tint)";
                    e.currentTarget.style.color = "var(--color-kumo-default)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (i !== 0) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--color-kumo-subtle)";
                  }
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: `1.5px solid ${i === 0 ? "var(--color-kumo-brand)" : "var(--color-kumo-line)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: i === 0 ? "var(--color-kumo-brand)" : "var(--color-kumo-muted)",
                    background: "var(--color-kumo-base)",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  {splitLabel(label).map((part, j) =>
                    part.code ? (
                      <code
                        key={j}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          background: "var(--color-kumo-tint)",
                          border: "1px solid var(--color-kumo-line)",
                          borderRadius: 5,
                          padding: "1px 5px",
                          color: "var(--color-kumo-interact)",
                        }}
                      >
                        {part.text}
                      </code>
                    ) : (
                      <span key={j}>{part.text}</span>
                    ),
                  )}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    flexShrink: 0,
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--color-kumo-muted)",
                    border: "1px solid var(--color-kumo-line)",
                    borderRadius: 4,
                    padding: "1px 6px",
                    background: "var(--color-kumo-tint)",
                  }}
                >
                  {["y", "p", "esc"][i]}
                </span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--color-kumo-muted)" }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 10,
              border: "1px solid var(--color-kumo-line)", borderRadius: 4,
              padding: "0 5px", background: "var(--color-kumo-tint)",
            }}>
              ↵
            </span>{" "}
            确认选择 ·{" "}
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 10,
              border: "1px solid var(--color-kumo-line)", borderRadius: 4,
              padding: "0 5px", background: "var(--color-kumo-tint)",
            }}>
              esc
            </span>{" "}
            拒绝并给出指示
          </div>
        </>
      )}

      {/* 反馈阶段：输入框 + 发送 */}
      {phase === "feedback" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: isDeniedStyle ? 10 : 8 }}>
          <Input
            ref={inputRef}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitFeedback();
            }}
            placeholder="告诉 pi 应该怎么做…"
            style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 13 }}
          />
          <Button variant="primary" onClick={handleSubmitFeedback} disabled={!feedback.trim()}>
            发送
          </Button>
        </div>
      )}

      {phase === "feedback" && (
        <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--color-kumo-muted)" }}>
          提交后该文本将作为反馈发给 agent（操作保持拒绝）
        </div>
      )}
    </div>
  );
}
