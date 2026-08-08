"use client";

// 权限模式选择器 — Codex 风格：attach 按钮右侧的盾牌按钮，
// 点开选择权限模式（请求批准 / 替我审批 / 仅风险 / 完全访问 / 自定义）。
// 对应 pi-permission-modes 扩展的模式，通过 /api/permission 读写。

import { useCallback, useEffect, useRef, useState } from "react";
import { DropdownMenu } from "@/components/ui";
import { GearSix, Robot, Shield, ShieldCheck, ShieldWarning } from "@phosphor-icons/react";

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
  disabled?: boolean;
}> = [
  {
    id: "ask",
    icon: <ShieldWarning size={16} weight="duotone" />,
    label: "请求批准",
    desc: "编辑外部文件和使用互联网时始终询问",
  },
  {
    id: "auto",
    icon: <Robot size={16} weight="duotone" />,
    label: "替我审批",
    desc: "自动审查并代为批准（开发中）",
    disabled: true,
  },
  {
    id: "risky",
    icon: <ShieldWarning size={16} weight="duotone" />,
    label: "仅对检测到的风险操作请求批准",
    desc: "自动检测危险操作，仅对风险询问",
  },
  {
    id: "full",
    icon: <ShieldCheck size={16} weight="duotone" />,
    label: "完全访问权限",
    desc: "可不受限制地访问互联网和您电脑上的任何文件",
  },
  {
    id: "custom",
    icon: <GearSix size={16} weight="duotone" />,
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

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) load(); }}>
      <DropdownMenu.Trigger
        render={(p) => (
          <button
            {...p}
            type="button"
            title={`权限模式：${MODE_LABELS[current]}（${loading ? "切换中…" : error ?? "点击切换"}`}
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
              color: current !== "full" ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "background 0.12s, color 0.12s",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = current !== "full" ? "var(--accent)" : "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = current !== "full" ? "var(--accent)" : "var(--text-muted)";
            }}
          >
            <Shield size={15} weight="fill" />
          </button>
        )}
      />
      <DropdownMenu.Content align="start" sideOffset={6}>
        <DropdownMenu.Label style={{ fontSize: 11, color: "var(--color-kumo-subtle)" }}>
          权限模式 · 当前：{MODE_LABELS[current]}
        </DropdownMenu.Label>
        {MODE_ITEMS.map((item) =>
          item.disabled ? (
            <DropdownMenu.Item key={item.id} disabled icon={item.icon} style={{ opacity: 0.5 }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "var(--color-kumo-subtle)" }}>{item.desc}</div>
              </div>
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              key={item.id}
              icon={item.icon}
              selected={current === item.id}
              onClick={() => {
                if (item.id !== "auto") void switchMode(item.id as PermissionMode);
              }}
            >
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "var(--color-kumo-subtle)" }}>{item.desc}</div>
              </div>
            </DropdownMenu.Item>
          ),
        )}
        {error && (
          <DropdownMenu.Item disabled style={{ color: "var(--color-kumo-badge-red)" }}>
            {error}
          </DropdownMenu.Item>
        )}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
