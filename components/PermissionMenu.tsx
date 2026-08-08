"use client";

// 权限模式选择器 — Codex 风格：attach 按钮右侧的盾牌按钮，
// 点开选择权限模式（请求批准 / 替我审批 / 仅风险 / 完全访问 / 自定义）。
// 对应 pi-permission-modes 扩展的模式，通过 /api/permission 读写。
// UI 对齐 Codex：两行菜单项（名称 + 描述）、选中勾选标记、
// Full Access 用红色警示（DANGER_FULL_ACCESS）。

import { useCallback, useEffect, useRef, useState } from "react";
import { DropdownMenu } from "@/components/ui";
import { Check, GearSix, Robot, Shield, ShieldCheck, ShieldWarning } from "@phosphor-icons/react";

export type PermissionMode = "full" | "ask" | "risky" | "readonly" | "custom";

interface PermissionState {
  mode: PermissionMode;
  rules: { allow: string[]; ask: string[]; deny: string[] };
  defaultPolicy: string;
  approvalTimeoutMs: number;
}

const MODE_ITEMS: Array<{
  id: PermissionMode | "auto";
  icon: React.ReactNode;
  label: string;
  desc: string;
  danger?: boolean;
  disabled?: boolean;
}> = [
  {
    id: "ask",
    icon: <ShieldWarning size={15} weight="duotone" />,
    label: "请求批准",
    desc: "编辑外部文件和使用互联网时始终询问",
  },
  {
    id: "auto",
    icon: <Robot size={15} weight="duotone" />,
    label: "替我审批",
    desc: "自动审查并代为批准（开发中）",
    disabled: true,
  },
  {
    id: "risky",
    icon: <ShieldWarning size={15} weight="duotone" />,
    label: "仅对检测到的风险操作请求批准",
    desc: "自动检测危险操作，仅对风险询问",
  },
  {
    id: "full",
    icon: <ShieldCheck size={15} weight="duotone" />,
    label: "完全访问权限",
    desc: "可不受限制地访问互联网和您电脑上的任何文件（谨慎使用）",
    danger: true,
  },
  {
    id: "custom",
    icon: <GearSix size={15} weight="duotone" />,
    label: "自定义 (config)",
    desc: "使用 config 中定义的权限",
  },
];

const MODE_LABELS: Record<PermissionMode, string> = {
  full: "完全访问",
  ask: "请求批准",
  risky: "仅风险操作",
  readonly: "只读",
  custom: "自定义",
};

const DANGER = "var(--color-kumo-badge-red)";
const BRAND = "var(--color-kumo-brand)";

export function PermissionMenu() {
  const [state, setState] = useState<PermissionState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/permission");
      if (!res.ok) return;
      const data = (await res.json()) as PermissionState;
      if (mountedRef.current) setState(data);
    } catch {
      // 忽略加载失败（静默降级为无按钮状态）
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const switchMode = useCallback(
    async (mode: PermissionMode) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/permission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });
        if (res.ok) {
          await load();
        } else {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(data?.error ?? "切换失败");
        }
      } catch {
        setError("切换失败");
      } finally {
        setLoading(false);
      }
    },
    [load],
  );

  const current = state?.mode ?? "full";
  const isDanger = current === "full";

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) load(); }}>
      <DropdownMenu.Trigger
        render={(p) => (
          <button
            {...p}
            type="button"
            title={
              isDanger
                ? "权限模式：完全访问权限（无限制，谨慎使用）"
                : `权限模式：${MODE_LABELS[current]}${loading ? "（切换中…）" : ""}`
            }
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              padding: 0,
              background: "none",
              border: "none",
              borderRadius: 9,
              color: isDanger ? DANGER : current !== "full" ? BRAND : "var(--text-muted)",
              cursor: "pointer",
              transition: "background 0.12s, color 0.12s",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              if (!isDanger) e.currentTarget.style.color = current !== "full" ? BRAND : "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              if (!isDanger) e.currentTarget.style.color = current !== "full" ? BRAND : "var(--text-muted)";
            }}
          >
            <Shield size={15} weight="fill" />
          </button>
        )}
      />
      <DropdownMenu.Content align="start" sideOffset={6} style={{ minWidth: 300 }}>
        <DropdownMenu.Group>
          <DropdownMenu.Label style={{ fontSize: 11, color: "var(--color-kumo-subtle)" }}>
            权限模式 · 当前：{MODE_LABELS[current]}
          </DropdownMenu.Label>
        </DropdownMenu.Group>
        {MODE_ITEMS.map((item) => {
          const selected = (item.id as string) === current;
          const itemDanger = !!item.danger;
          const iconColor = itemDanger ? DANGER : selected ? BRAND : "var(--color-kumo-subtle)";
          const titleColor = itemDanger ? DANGER : selected ? "var(--color-kumo-default)" : "var(--color-kumo-default)";
          const descColor = itemDanger
            ? "color-mix(in srgb, var(--color-kumo-badge-red) 80%, var(--color-kumo-subtle))"
            : "var(--color-kumo-subtle)";
          return (
            <DropdownMenu.Item
              key={item.id}
              disabled={item.disabled}
              selected={selected}
              onClick={() => {
                if (!item.disabled && item.id !== "auto") void switchMode(item.id as PermissionMode);
              }}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 10px" }}
            >
              {/* 固定宽度图标列：选中显示对勾，否则显示模式图标（垂直与首行对齐） */}
              <span
                style={{
                  width: 20,
                  height: 18,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: iconColor,
                  marginTop: 1,
                }}
              >
                {selected ? <Check size={14} weight="bold" /> : item.icon}
              </span>
              {/* 名称 + 描述 两行（Codex SelectionItem 布局） */}
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: titleColor, display: "flex", alignItems: "center", gap: 6 }}>
                  {item.label}
                  {itemDanger && !selected && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: DANGER,
                      border: `1px solid color-mix(in srgb, var(--color-kumo-badge-red) 45%, transparent)`,
                      borderRadius: 4,
                      padding: "0 5px",
                      lineHeight: "1.5",
                      background: "color-mix(in srgb, var(--color-kumo-badge-red) 10%, transparent)",
                    }}>
                      危险
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 11, lineHeight: 1.45, color: descColor }}>{item.desc}</span>
              </span>
            </DropdownMenu.Item>
          );
        })}
        {error && (
          <DropdownMenu.Item disabled style={{ color: DANGER, fontSize: 12 }}>
            {error}
          </DropdownMenu.Item>
        )}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
