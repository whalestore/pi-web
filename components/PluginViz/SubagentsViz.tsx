"use client";

/**
 * SubagentsViz —— pi-subagents 可视化配置（真实数据绑定）
 *
 * 数据源：
 * - GET  /api/plugin-viz/subagents → { configJson, settingsSubagents }
 * - PUT  /api/plugin-viz/subagents → 保存（部分更新）
 *
 * 配置源：
 * - config.json（扩展级）：~/.pi/agent/extensions/subagent/config.json
 * - settings.json → subagents（设置级）
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Field, Input, Select, Switch, Badge, Dialog, Collapsible } from "@/components/ui";

type VizData = {
  configJson: Record<string, any>;
  settingsSubagents: Record<string, any>;
};

const MODEL_ITEMS = [
  { value: "", label: "（跟随父会话）" },
  { value: "deepseek-v4-flash", label: "deepseek-v4-flash" },
  { value: "deepseek-v4-pro", label: "deepseek-v4-pro" },
  { value: "anthropic/claude-sonnet-4", label: "anthropic/claude-sonnet-4" },
  { value: "anthropic/claude-opus-4-8", label: "anthropic/claude-opus-4-8" },
];

const THINKING_ITEMS = [
  { value: "", label: "继承父会话" },
  { value: "off", label: "off" },
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
  { value: "xhigh", label: "xhigh" },
];

const AGENTS = [
  { name: "scout", desc: "快速代码侦察：相关文件、入口、数据流、风险", model: "deepseek-v4-flash", tags: ["只读"], override: false },
  { name: "researcher", desc: "Web/文档调研，带来源与调研简报", model: "deepseek-v4-flash", tags: ["需 pi-web-access"], override: false },
  { name: "planner", desc: "从现有上下文制定实现计划，只读不编辑", model: "deepseek-v4-pro", tags: ["只读"], override: false },
  { name: "worker", desc: "实现工作：改文件、验证、未批准决策上报", model: "deepseek-v4-pro", tags: ["写", "fork 上下文"], override: true },
  { name: "reviewer", desc: "对照任务/计划审查代码、测试、边界", model: "deepseek-v4-pro", tags: ["只读"], override: true },
  { name: "oracle", desc: "第二意见：挑战假设、发现漂移、不编辑", model: "deepseek-v4-pro", tags: ["只读", "fork"], override: true },
  { name: "context-builder", desc: "规划前收集代码上下文并写交接材料", model: "deepseek-v4-flash", tags: ["只读"], override: false },
  { name: "delegate", desc: "通用轻量委派，行为接近父会话", model: "跟随父会话", tags: ["append 模式"], override: false },
];

function SwitchRow({ title, desc, checked, onChange }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-kumo-line last:border-0">
      <div>
        <div className="text-base font-medium text-kumo-default">{title}</div>
        <div className="text-sm text-kumo-subtle mt-0.5">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border border-kumo-line rounded-lg overflow-hidden bg-kumo-base ${className}`}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold uppercase tracking-wide text-kumo-subtle mt-5 mb-2">{children}</div>;
}

function PageHeading({ children }: { children: React.ReactNode }) {
  return <div className="mb-1"><h3 className="text-lg font-semibold">{children}</h3></div>;
}

export function SubagentsViz({ onReloaded }: { onReloaded?: () => void }) {
  const [page, setPage] = useState("general");
  const [data, setData] = useState<VizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>("reviewer");

  // ---- 加载真实配置 ----
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plugin-viz/subagents");
      const json = (await res.json()) as VizData & { error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ---- 配置读写辅助 ----
  const cfg = useMemo(() => data?.configJson ?? {}, [data]);
  const sub = useMemo(() => data?.settingsSubagents ?? {}, [data]);
  const overrides = useMemo(() => (sub.agentOverrides && typeof sub.agentOverrides === "object" ? sub.agentOverrides : {}) as Record<string, any>, [sub]);
  const watchdog = useMemo(() => (sub.watchdog && typeof sub.watchdog === "object" ? sub.watchdog : {}) as Record<string, any>, [sub]);
  const modelScope = useMemo(() => (sub.modelScope && typeof sub.modelScope === "object" ? sub.modelScope : {}) as Record<string, any>, [sub]);

  /** 更新 config.json 的某个键（顶层） */
  const setCfg = (key: string, value: unknown) => {
    setData((prev) => (prev ? { ...prev, configJson: { ...prev.configJson, [key]: value } } : prev));
  };
  /** 更新 config.json 的嵌套键（如 parallel.maxTasks） */
  const setCfgNested = (path: string, value: unknown) => {
    setData((prev) => {
      if (!prev) return prev;
      const keys = path.split(".");
      const cfg = { ...prev.configJson };
      let node: any = cfg;
      for (let i = 0; i < keys.length - 1; i++) {
        node[keys[i]] = { ...(node[keys[i]] ?? {}) };
        node = node[keys[i]];
      }
      node[keys[keys.length - 1]] = value;
      return { ...prev, configJson: cfg };
    });
  };
  /** 更新 settings.json 的 subagents 键（顶层） */
  const setSub = (key: string, value: unknown) => {
    setData((prev) => (prev ? { ...prev, settingsSubagents: { ...prev.settingsSubagents, [key]: value } } : prev));
  };
  /** 删除 agentOverrides.<name> */
  const removeOverride = (agent: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...overrides };
      delete next[agent];
      return { ...prev, settingsSubagents: { ...prev.settingsSubagents, agentOverrides: next } };
    });
  };
  /** 更新 agentOverrides.<name>.<field> */
  const setOverride = (agent: string, field: string, value: unknown) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev.settingsSubagents, agentOverrides: { ...overrides, [agent]: { ...(overrides[agent] ?? {}), [field]: value } } };
      return { ...prev, settingsSubagents: next };
    });
  };
  /** 更新 watchdog.<group>.<field> */
  const setWatchdog = (group: string, field: string, value: unknown) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev.settingsSubagents, watchdog: { ...watchdog, [group]: { ...(watchdog[group] ?? {}), [field]: value } } };
      return { ...prev, settingsSubagents: next };
    });
  };
  /** 更新 modelScope.<field> */
  const setScope = (field: string, value: unknown) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev.settingsSubagents, modelScope: { ...modelScope, [field]: value } };
      return { ...prev, settingsSubagents: next };
    });
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/plugin-viz/subagents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configJson: data.configJson, settingsSubagents: data.settingsSubagents }),
      });
      const json = (await res.json()) as VizData & { error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onReloaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const navPages = [
    { id: "general", label: "通用设置" },
    { id: "models", label: "模型路由" },
    { id: "agents", label: "Agent 管理" },
    { id: "workflow", label: "工作流编排" },
    { id: "watchdog", label: "Watchdog" },
    { id: "perms", label: "权限" },
    { id: "mission", label: "Mission 调度" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-kumo-subtle">
        加载 pi-subagents 配置…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <div className="text-sm text-kumo-danger">{error}</div>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => void load()}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* 顶部分类导航 */}
      <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-kumo-line flex-shrink-0">
        {navPages.map((p) => (
          <button
            key={p.id}
            onClick={() => setPage(p.id)}
            className={`px-2.5 py-1 rounded-md text-xs cursor-pointer border-0 ${
              page === p.id ? "bg-kumo-brand text-white font-semibold" : "bg-transparent text-kumo-subtle hover:bg-kumo-tint"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 内容滚动区 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
        {/* ══════ 通用设置 ══════ */}
        {page === "general" && (
          <div>
            <PageHeading>通用设置</PageHeading>
            <div className="text-sm text-kumo-subtle mb-3">
              写入 <code className="font-mono text-xs bg-kumo-tint px-1 rounded">~/.pi/agent/extensions/subagent/config.json</code> · 重启 pi 或 /reload 生效
            </div>

            <SectionLabel>UI 展示</SectionLabel>
            <Card>
              <div className="px-4 py-1">
                <SwitchRow title="FleetView 常驻面板" desc="编辑器下方显示运行中的子代理摘要 · fleetView" checked={!!cfg.fleetView} onChange={(v) => setCfg("fleetView", v)} />
                <SwitchRow title="异步运行小部件" desc="编辑器下方显示后台任务状态 · asyncWidget" checked={cfg.asyncWidget !== false} onChange={(v) => setCfg("asyncWidget", v)} />
                <SwitchRow title="完成通知批量合并" desc="后台任务同批完成时合并为一条静默通知 · completionBatch.enabled" checked={cfg.completionBatch?.enabled !== false} onChange={(v) => setCfg("completionBatch", { ...(cfg.completionBatch ?? {}), enabled: v })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                <Field label="FleetView 位置 · fleetViewPlacement">
                  <Select items={[{ value: "belowEditor", label: "belowEditor（下方）" }, { value: "aboveEditor", label: "aboveEditor（上方）" }]} value={cfg.fleetViewPlacement ?? "belowEditor"} onValueChange={(v) => setCfg("fleetViewPlacement", String(v))} />
                </Field>
                <Field label="工具结果展示 · inlineToolDisplay">
                  <Select items={[{ value: "rich", label: "rich（动态展示）" }, { value: "summary", label: "summary（单行稳定）" }]} value={cfg.inlineToolDisplay ?? "rich"} onValueChange={(v) => setCfg("inlineToolDisplay", String(v))} />
                </Field>
                <Field label="工具描述模式 · toolDescriptionMode">
                  <Select items={[{ value: "full", label: "full（完整描述）" }, { value: "compact", label: "compact（精简）" }, { value: "custom", label: "custom（自定义文件）" }]} value={cfg.toolDescriptionMode ?? "full"} onValueChange={(v) => setCfg("toolDescriptionMode", String(v))} />
                </Field>
              </div>
            </Card>

            <SectionLabel>运行行为</SectionLabel>
            <Card>
              <div className="px-4 py-1">
                <SwitchRow title="默认后台运行" desc="workflowScript 未指定 async 时默认异步 · asyncByDefault" checked={cfg.asyncByDefault !== false} onChange={(v) => setCfg("asyncByDefault", v)} />
                <SwitchRow title="强制顶层异步" desc="顶层单/并行/链运行强制后台并跳过启动确认 · forceTopLevelAsync" checked={!!cfg.forceTopLevelAsync} onChange={(v) => setCfg("forceTopLevelAsync", v)} />
                <SwitchRow title="subagent_wait 阻塞等待" desc="关闭后 wait 工具直接返回不阻塞 · waitTool.enabled" checked={cfg.waitTool?.enabled !== false} onChange={(v) => setCfg("waitTool", { ...(cfg.waitTool ?? {}), enabled: v })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                <Field label="嵌套委派深度 · maxSubagentDepth" description="0 = 禁止嵌套，默认 2 层">
                  <Input type="number" value={cfg.maxSubagentDepth ?? 2} onChange={(e) => setCfg("maxSubagentDepth", Number(e.target.value))} className="w-full" />
                </Field>
                <Field label="会话内最大启动数 · maxSubagentSpawnsPerSession" description="0 = 不限制">
                  <Input type="number" value={cfg.maxSubagentSpawnsPerSession ?? 0} onChange={(e) => setCfg("maxSubagentSpawnsPerSession", Number(e.target.value))} className="w-full" />
                </Field>
                <Field label="全局并发上限 · globalConcurrencyLimit">
                  <Input type="number" value={cfg.globalConcurrencyLimit ?? 20} onChange={(e) => setCfg("globalConcurrencyLimit", Number(e.target.value))} className="w-full" />
                </Field>
                <Field label="并行任务数 · parallel.maxTasks">
                  <Input type="number" value={cfg.parallel?.maxTasks ?? 8} onChange={(e) => setCfgNested("parallel.maxTasks", Number(e.target.value))} className="w-full" />
                </Field>
                <Field label="并行并发数 · parallel.concurrency">
                  <Input type="number" value={cfg.parallel?.concurrency ?? 4} onChange={(e) => setCfgNested("parallel.concurrency", Number(e.target.value))} className="w-full" />
                </Field>
              </div>
            </Card>

            <SectionLabel>产物与存储</SectionLabel>
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="产物目录策略 · artifactDir">
                  <Select items={[{ value: "project", label: "project（项目内 .pi-subagents/）" }, { value: "session", label: "session（pi 会话目录）" }, { value: "temp", label: "temp（系统临时）" }]} value={cfg.artifactDir ?? "project"} onValueChange={(v) => setCfg("artifactDir", String(v))} />
                </Field>
                <Field label="会话目录 · defaultSessionDir">
                  <Input value={cfg.defaultSessionDir ?? "~/.pi/agent/sessions/subagent/"} onChange={(e) => setCfg("defaultSessionDir", e.target.value)} className="w-full font-mono" />
                </Field>
                <Field label="worktree 基目录 · worktreeBaseDir" description="worktree: true 运行的隔离工作区">
                  <Input value={cfg.worktreeBaseDir ?? ""} placeholder="默认系统临时目录" onChange={(e) => setCfg("worktreeBaseDir", e.target.value)} className="w-full font-mono" />
                </Field>
                <Field label="单次运行输出目录 · singleRunOutputBaseDir" description="相对 output 路径的根目录">
                  <Input value={cfg.singleRunOutputBaseDir ?? "~/.pi/subagent-outputs"} onChange={(e) => setCfg("singleRunOutputBaseDir", e.target.value)} className="w-full font-mono" />
                </Field>
              </div>
            </Card>

            <SectionLabel>高级设置</SectionLabel>
            <Card>
              <Collapsible.Root>
                <Collapsible.DefaultTrigger className="w-full px-4 py-2.5 text-sm font-medium text-kumo-default hover:bg-kumo-tint">
                  ▸ 展开高级选项（worktreeHook / intercomBridge / authorityPolicy / 预算）
                </Collapsible.DefaultTrigger>
                <Collapsible.DefaultPanel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                    <Field label="worktree 初始化 Hook · worktreeSetupHook" description="每个 worktree 创建时运行一次（绝对路径/~/相对）">
                      <Input value={cfg.worktreeSetupHook ?? ""} placeholder="./scripts/setup-worktree.mjs" onChange={(e) => setCfg("worktreeSetupHook", e.target.value)} className="w-full font-mono" />
                    </Field>
                    <Field label="Hook 超时 · worktreeSetupHookTimeoutMs">
                      <Input type="number" value={cfg.worktreeSetupHookTimeoutMs ?? 30000} onChange={(e) => setCfg("worktreeSetupHookTimeoutMs", Number(e.target.value))} className="w-full" />
                    </Field>
                    <Field label="intercom 桥接 · intercomBridge.mode">
                      <Select items={[{ value: "always", label: "always（默认，始终注入）" }, { value: "fork-only", label: "fork-only（仅 fork 运行）" }, { value: "off", label: "off（关闭）" }]} value={cfg.intercomBridge?.mode ?? "always"} onValueChange={(v) => setCfg("intercomBridge", { ...(cfg.intercomBridge ?? {}), mode: String(v) })} />
                    </Field>
                    <Field label="操作确认策略 · authorityPolicy" description="6 个动作：auto / confirm / forbid">
                      <Input value={typeof cfg.authorityPolicy === "string" ? cfg.authorityPolicy : JSON.stringify(cfg.authorityPolicy ?? {})} onChange={(e) => setCfg("authorityPolicy", e.target.value)} className="w-full font-mono" />
                    </Field>
                    <Field label="回合预算默认 · turnBudget" description="如 {maxTurns:20, graceTurns:2} JSON 格式">
                      <Input value={typeof cfg.turnBudget === "string" ? cfg.turnBudget : JSON.stringify(cfg.turnBudget ?? {})} placeholder={'{"maxTurns":20,"graceTurns":2}'} onChange={(e) => setCfg("turnBudget", e.target.value)} className="w-full font-mono" />
                    </Field>
                    <Field label="工具调用预算 · toolBudget" description="如 {soft:40, hard:60} JSON 格式">
                      <Input value={typeof cfg.toolBudget === "string" ? cfg.toolBudget : JSON.stringify(cfg.toolBudget ?? {})} placeholder={'{"soft":40,"hard":60}'} onChange={(e) => setCfg("toolBudget", e.target.value)} className="w-full font-mono" />
                    </Field>
                    <Field label="用量预算 · usageBudget" description="如 {tokens:{hard:500000}, costUsd:{hard:5}} JSON 格式">
                      <Input value={typeof cfg.usageBudget === "string" ? cfg.usageBudget : JSON.stringify(cfg.usageBudget ?? {})} placeholder={'{"tokens":{"hard":500000},"costUsd":{"hard":5}}'} onChange={(e) => setCfg("usageBudget", e.target.value)} className="w-full font-mono" />
                    </Field>
                  </div>
                </Collapsible.DefaultPanel>
              </Collapsible.Root>
            </Card>
          </div>
        )}

        {/* ══════ 模型路由 ══════ */}
        {page === "models" && (
          <div>
            <PageHeading>模型路由</PageHeading>
            <div className="text-sm text-kumo-subtle mb-3">
              优先级：运行参数 &gt; agent 定义 &gt; 角色覆盖 &gt; 全局默认 &gt; 父会话 · 写入 settings.json → subagents
            </div>
            <SectionLabel>全局默认</SectionLabel>
            <Card>
              <div className="px-4 py-1">
                <SwitchRow title="禁用思考后缀" desc="provider 拒绝带 thinking 后缀的模型 id 时开启 · disableThinking" checked={!!sub.disableThinking} onChange={(v) => setSub("disableThinking", v)} />
                <SwitchRow title="禁用全部内置 agent" desc="隐藏所有内置角色，仅保留自定义 · disableBuiltins" checked={!!sub.disableBuiltins} onChange={(v) => setSub("disableBuiltins", v)} />
                <SwitchRow title="强制模型范围" desc="开启后白名单外的模型显式指定会报错 · modelScope.enforce" checked={!!modelScope.enforce} onChange={(v) => setScope("enforce", v)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                <Field label="默认模型 · defaultModel" description="支持模糊匹配">
                  <Select items={MODEL_ITEMS} value={sub.defaultModel ?? ""} onValueChange={(v) => setSub("defaultModel", String(v) || undefined)} />
                </Field>
                <Field label="默认思考级别 · defaultThinking">
                  <Select items={THINKING_ITEMS} value={sub.defaultThinking ?? ""} onValueChange={(v) => setSub("defaultThinking", String(v) || undefined)} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="模型范围白名单 · modelScope.allow" description="glob 模式逗号分隔">
                    <Input value={Array.isArray(modelScope.allow) ? modelScope.allow.join(", ") : ""} onChange={(e) => setScope("allow", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} className="w-full" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="默认扩展白名单 · defaultExtensions" description="未声明 extensions 的 agent 使用的扩展列表">
                    <Input value={Array.isArray(sub.defaultExtensions) ? sub.defaultExtensions.join(", ") : ""} onChange={(e) => setSub("defaultExtensions", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} className="w-full font-mono" />
                  </Field>
                </div>
              </div>
            </Card>

            <SectionLabel>角色覆盖 · agentOverrides</SectionLabel>
            <Card>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-kumo-line text-left">
                    <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">角色</th>
                    <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">模型</th>
                    <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">思考</th>
                    <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {Object.keys(overrides).length === 0 ? (
                    <tr>
                      <td className="px-4 py-3 text-xs text-kumo-inactive" colSpan={4}>暂无角色覆盖，点击下方角色添加</td>
                    </tr>
                  ) : (
                    Object.entries(overrides).map(([agent, ov]) => (
                      <tr key={agent} className="border-b border-kumo-line">
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-xs">{agent}</span>{" "}
                          <Badge variant="success">已覆盖</Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <Select size="sm" items={MODEL_ITEMS} value={ov.model ?? ""} onValueChange={(v) => setOverride(agent, "model", String(v) || undefined)} />
                        </td>
                        <td className="px-4 py-2.5">
                          <Select size="sm" items={THINKING_ITEMS} value={ov.thinking ?? ""} onValueChange={(v) => setOverride(agent, "thinking", String(v) || undefined)} />
                        </td>
                        <td className="px-4 py-2.5">
                          <Button variant="ghost" size="xs" onClick={() => removeOverride(agent)}>删除</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>

            <div className="flex gap-2 mt-3 flex-wrap">
              {AGENTS.filter((a) => !(a.name in overrides)).map((a) => (
                <Button key={a.name} variant="outline" size="xs" onClick={() => setOverride(a.name, "model", undefined)}>
                  ＋ {a.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* ══════ Agent 管理 ══════ */}
        {page === "agents" && (
          <div>
            <PageHeading>Agent 管理</PageHeading>
            <SectionLabel>推荐委派流转（官方循环）</SectionLabel>
            <Card className="p-3">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {["clarify", "scout", "planner", "worker", "reviewer ×N", "oracle"].map((a, i) => (
                  <span key={a} className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md border ${i === 0 ? "border-kumo-brand text-kumo-brand font-semibold" : "border-kumo-line bg-kumo-base"}`}>{a}</span>
                    {i < 5 && <span className="text-kumo-inactive">→</span>}
                  </span>
                ))}
              </div>
            </Card>

            <SectionLabel>角色卡片（内置 + 覆盖状态）</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AGENTS.map((a) => (
                <div
                  key={a.name}
                  onClick={() => setSelectedAgent(a.name)}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors bg-kumo-base ${selectedAgent === a.name ? "border-kumo-brand bg-kumo-brand/5" : "border-kumo-line hover:border-kumo-brand/60"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold">{a.name}</span>
                    <Badge variant="neutral">内置</Badge>
                    {a.name in overrides && <Badge variant="success">覆盖中</Badge>}
                  </div>
                  <div className="text-sm text-kumo-subtle mt-1.5">{a.desc}</div>
                  <div className="flex items-center gap-2 mt-2 text-xs font-mono text-kumo-inactive">
                    {overrides[a.name]?.model ?? a.model}
                    {a.tags.map((t) => (<span key={t} className="text-kumo-subtle">· {t}</span>))}
                  </div>
                </div>
              ))}
            </div>

            <SectionLabel>编辑：{selectedAgent}（点击卡片切换）</SectionLabel>
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="模型 · model">
                  <Select items={MODEL_ITEMS} value={overrides[selectedAgent ?? ""]?.model ?? ""} onValueChange={(v) => selectedAgent && setOverride(selectedAgent, "model", String(v) || undefined)} />
                </Field>
                <Field label="思考级别 · thinking">
                  <Select items={THINKING_ITEMS} value={overrides[selectedAgent ?? ""]?.thinking ?? ""} onValueChange={(v) => selectedAgent && setOverride(selectedAgent, "thinking", String(v) || undefined)} />
                </Field>
                <Field label="备用模型 · fallbackModels" description="限流/鉴权失败时按序降级">
                  <Input value={Array.isArray(overrides[selectedAgent ?? ""]?.fallbackModels) ? overrides[selectedAgent ?? ""].fallbackModels.join(", ") : ""} placeholder="openai/gpt-5-mini" onChange={(e) => selectedAgent && setOverride(selectedAgent, "fallbackModels", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} className="font-mono w-full" />
                </Field>
                <Field label="禁用该角色 · disabled">
                  <Select items={[{ value: "false", label: "启用" }, { value: "true", label: "禁用" }]} value={String(overrides[selectedAgent ?? ""]?.disabled ?? false)} onValueChange={(v) => selectedAgent && setOverride(selectedAgent, "disabled", v === "true")} />
                </Field>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="primary" onClick={() => void save()}>保存覆盖</Button>
              </div>
            </Card>
          </div>
        )}

        {/* ══════ 工作流编排 ══════ */}
        {page === "workflow" && (
          <div>
            <PageHeading>工作流编排</PageHeading>
            <SectionLabel>模板库（点击插入 workflowScript）</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { name: "单代理委派", desc: "一个子代理完成任务并返回结果", code: "runs.run(agent)", tag: "基础" },
                { name: "顺序链", desc: "上一步输出作下一步输入", code: "scout → worker → reviewer", tag: "基础" },
                { name: "并行扇出", desc: "多个独立审查同时进行，聚合结果", code: "runs.all ×3 reviewer", tag: "审查" },
                { name: "审查循环", desc: "worker + reviewer 循环直到干净或达上限", code: "worker ⇄ reviewer · max 3 轮", tag: "审查" },
                { name: "并行调研", desc: "researcher + scout 组合：外部证据 + 本地上下文", code: "research ∥ scout", tag: "调研" },
                { name: "混合编排", desc: "顺序 + 并行 + worktree 隔离", code: "scout → worker×2(wt) → reviewer", tag: "高级" },
              ].map((t, i) => (
                <div key={t.name} className={`border rounded-lg p-3 cursor-pointer bg-kumo-base ${i === 0 ? "border-kumo-brand bg-kumo-brand/5" : "border-kumo-line hover:border-kumo-brand/60"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold">{t.name}</span>
                    <Badge variant={t.tag === "高级" ? "warning" : t.tag === "审查" ? "info" : "neutral"}>{t.tag}</Badge>
                  </div>
                  <div className="text-sm text-kumo-subtle mt-1">{t.desc}</div>
                  <div className="text-xs font-mono text-kumo-inactive mt-2">{t.code}</div>
                </div>
              ))}
            </div>
            <SectionLabel>workflowScript · 可编辑</SectionLabel>
            <Card>
              <div className="flex items-center justify-between px-3 py-2 border-b border-kumo-line bg-kumo-tint">
                <span className="text-xs font-mono text-kumo-inactive">workflowScript.js</span>
                <Button variant="ghost" size="xs">复制</Button>
              </div>
              <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto">{`// 并行审查扇出：三个独立角度
const scan = await runs.run("scan", { agent: "scout", task: "扫描代码库结构" });
const reviews = await runs.all([
  { key: "correctness", agent: "reviewer", task: "审查正确性: " + scan.output },
  { key: "tests",       agent: "reviewer", task: "审查测试: " + scan.output },
  { key: "simplicity",  agent: "reviewer", task: "审查简洁性: " + scan.output }
]);
return reviews.map(r => r.output);`}</pre>
            </Card>
            <SectionLabel>运行参数</SectionLabel>
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="默认上下文 · context">
                  <Select items={[{ value: "", label: "继承（各 agent 默认）" }, { value: "fresh", label: "fresh（全新）" }, { value: "fork", label: "fork（分支父会话）" }]} value="" onValueChange={() => {}} />
                </Field>
                <Field label="默认执行方式 · async">
                  <Select items={[{ value: "", label: "async（后台，默认）" }, { value: "foreground", label: "foreground（前台流式）" }]} value="" onValueChange={() => {}} />
                </Field>
              </div>
              <div className="text-xs text-kumo-inactive mt-3 pt-3 border-t border-kumo-line">
                顶层运行参数（context/async/worktree/acceptance/timeoutMs/chatProgress）在每次调用时指定，无需全局配置；
                监督协调：子代理可用 contact_supervisor 向父会话提问；递归保护：maxSubagentDepth 默认 2 层
              </div>
            </Card>
          </div>
        )}

        {/* ══════ Watchdog ══════ */}
        {page === "watchdog" && (
          <div>
            <PageHeading>Watchdog 看门狗</PageHeading>
            <div className="text-sm text-kumo-subtle mb-3">可选对抗性审查 · settings.json → subagents.watchdog</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {[
                { label: "状态", value: watchdog.enabled ? <Badge variant="success">● 已启用</Badge> : <Badge variant="neutral">未启用</Badge> },
                { label: "审查模型", value: <span className="font-mono text-xs">{watchdog.main?.model ?? "跟随会话模型"}</span> },
                { label: "Scope 监控", value: watchdog.scope?.enabled ? "开" : "关" },
                { label: "LSP 诊断", value: watchdog.lsp?.enabled ? "开" : "关" },
              ].map((s) => (
                <div key={s.label} className="border border-kumo-line rounded-lg p-3 bg-kumo-base">
                  <div className="text-xs text-kumo-inactive">{s.label}</div>
                  <div className="text-base font-semibold mt-1">{s.value}</div>
                </div>
              ))}
            </div>
            <SectionLabel>配置</SectionLabel>
            <Card>
              <div className="px-4 py-1">
                <SwitchRow title="启用 Watchdog" desc="agent_end 且 repo 有改动时触发 · enabled" checked={!!watchdog.enabled} onChange={(v) => setSub("watchdog", { ...watchdog, enabled: v })} />
                <SwitchRow title="Scope 监控" desc="记录当前目标，标记 scope-drift · scope.enabled" checked={!!watchdog.scope?.enabled} onChange={(v) => setWatchdog("scope", "enabled", v)} />
                <SwitchRow title="LSP 诊断" desc="审查前对变更的 TS/JS 文件跑语言服务器 · lsp.enabled" checked={watchdog.lsp?.enabled !== false} onChange={(v) => setWatchdog("lsp", "enabled", v)} />
                <SwitchRow title="Auto-follow" desc="发现 blocker 时自动排队后续消息 · autoFollow.blockers" checked={!!watchdog.autoFollow?.blockers} onChange={(v) => setWatchdog("autoFollow", "blockers", v)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                <Field label="主审查模型 · main.model">
                  <div className="flex gap-2 min-w-0">
                    <div className="flex-1 min-w-0"><Input value={watchdog.main?.model ?? ""} placeholder="跟随会话模型" onChange={(e) => setWatchdog("main", "model", e.target.value)} className="font-mono w-full" /></div>
                  </div>
                </Field>
                <Field label="审查思考级别 · main.thinking" description="推荐 high">
                  <Select items={THINKING_ITEMS} value={watchdog.main?.thinking ?? ""} onValueChange={(v) => setWatchdog("main", "thinking", String(v) || undefined)} />
                </Field>
                <Field label="子代理审查模型 · children.model">
                  <Input value={watchdog.children?.model ?? ""} placeholder="默认继承 main.model" onChange={(e) => setWatchdog("children", "model", e.target.value)} className="font-mono w-full" />
                </Field>
                <Field label="审查节奏 · cadence.everyNTools" description="0 = 仅 agent_end 审查">
                  <Input type="number" value={watchdog.cadence?.everyNTools ?? 0} onChange={(e) => setWatchdog("cadence", "everyNTools", Number(e.target.value))} className="w-full" />
                </Field>
              </div>
            </Card>
          </div>
        )}

        {/* ══════ 权限 ══════ */}
        {page === "perms" && (
          <div>
            <PageHeading>子代理工具权限</PageHeading>
            <div className="text-sm text-kumo-subtle mb-3">原生权限门（bash 除外）· config.json → permissions</div>
            <Card>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-kumo-line text-left">
                    <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">工具</th>
                    <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive w-40">策略</th>
                    <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {(["read", "write", "edit"] as const).map((tool) => {
                    const rule = cfg.permissions?.rules?.[tool];
                    return (
                      <tr key={tool} className="border-b border-kumo-line">
                        <td className="px-4 py-2.5 font-mono text-xs">{tool}</td>
                        <td className="px-4 py-2.5">
                          <Select size="sm" items={[{ value: "allow", label: "allow" }, { value: "ask", label: "ask" }, { value: "deny", label: "deny" }]} value={rule ?? "allow"} onValueChange={(v) => setCfgNested(`permissions.rules.${tool}`, String(v))} />
                        </td>
                        <td className="px-4 py-2.5 text-xs text-kumo-subtle">
                          {tool === "read" && "全局默认"} {tool === "write" && "调用时由子 watchdog 仲裁（预览 + 批准/拒绝）"} {tool === "edit" && "子代理禁止编辑"}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-xs">bash</td>
                    <td className="px-4 py-2.5"><Badge variant="neutral">不受管</Badge></td>
                    <td className="px-4 py-2.5 text-xs text-kumo-subtle">始终放行；命令级策略需 pi-guard</td>
                  </tr>
                </tbody>
              </table>
            </Card>
            <div className="text-xs text-kumo-inactive mt-2">
              ask：暂停调用 → 子 watchdog 一次性仲裁（approve/deny）→ 审计 JSONL；未列出工具默认 allow；agent frontmatter 可覆盖
            </div>
          </div>
        )}

        {/* ══════ Mission 调度 ══════ */}
        {page === "mission" && (
          <div>
            <PageHeading>Mission 与定时调度</PageHeading>
            <SectionLabel>Mission · missions</SectionLabel>
            <Card>
              <div className="px-4 py-1">
                <SwitchRow title="自动创建 Mission · missions.enabled" desc="普通任务启动时自动创建持久记录" checked={cfg.missions?.enabled !== false} onChange={(v) => setCfg("missions", { ...(cfg.missions ?? {}), enabled: v })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                <Field label="存储目录 · missions.directory">
                  <Input value={cfg.missions?.directory ?? ".pi-subagents/missions"} onChange={(e) => setCfg("missions", { ...(cfg.missions ?? {}), directory: e.target.value })} className="font-mono w-full" />
                </Field>
                <Field label="保留终端记录 · retainTerminal">
                  <Input type="number" value={cfg.missions?.retainTerminal ?? 200} onChange={(e) => setCfg("missions", { ...(cfg.missions ?? {}), retainTerminal: Number(e.target.value) })} className="w-full" />
                </Field>
              </div>
            </Card>
            <SectionLabel>定时调度 · scheduledRuns</SectionLabel>
            <Card>
              <div className="px-4 py-1">
                <SwitchRow title="启用调度 · scheduledRuns.enabled" desc="支持 at:+30m 一次性 / every:6h 周期" checked={cfg.scheduledRuns?.enabled !== false} onChange={(v) => setCfg("scheduledRuns", { ...(cfg.scheduledRuns ?? {}), enabled: v })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                <Field label="待执行上限 · scheduledRuns.maxPending">
                  <Input type="number" value={cfg.scheduledRuns?.maxPending ?? 20} onChange={(e) => setCfg("scheduledRuns", { ...(cfg.scheduledRuns ?? {}), maxPending: Number(e.target.value) })} className="w-full" />
                </Field>
              </div>
            </Card>
            <div className="text-xs text-kumo-inactive mt-2">
              调度的创建/暂停/恢复/运行通过 subagent 工具 action 管理（schedule.create / schedule.list / schedule.pause / schedule.resume / schedule.run / schedule.delete）
            </div>
          </div>
        )}
      </div>

      {/* 底部操作条 */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-kumo-line flex-shrink-0">
        <div className="min-w-0">
          {error && <span className="text-xs text-kumo-danger mr-2">{error}</span>}
          {saved && <span className="text-xs text-kumo-success">✓ 已保存</span>}
          {!saved && !error && <span className="text-xs font-mono text-kumo-inactive">settings.json → subagents · config.json</span>}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" onClick={() => void load()}>刷新</Button>
          <Button variant="primary" onClick={() => void save()} disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SubagentsViz;
