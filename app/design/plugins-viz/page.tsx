"use client";

/**
 * 设计图 v3 —— pi-subagents 可视化配置（真实组件实现，可交互预览）
 *
 * 使用标准：components/ui（@cloudflare/kumo 微调层）+ kumo 语义 token
 * 本页面是 PluginsConfig 可视化 tab 的最终设计稿，后续开发直接复用本页组件结构。
 *
 * 访问：http://127.0.0.1:37377/design/plugins-viz
 */
import { useState } from "react";
import { Button, Field, Input, Select, Switch, Badge, Dialog, Tabs, Text, Collapsible } from "@/components/ui";

/* ---------- 模拟数据 ---------- */
const MODEL_ITEMS = [
  { value: "deepseek-v4-flash", label: "deepseek-v4-flash" },
  { value: "deepseek-v4-pro", label: "deepseek-v4-pro" },
  { value: "anthropic/claude-sonnet-4", label: "anthropic/claude-sonnet-4" },
  { value: "anthropic/claude-opus-4-8", label: "anthropic/claude-opus-4-8" },
];

const THINKING_ITEMS = [
  { value: "inherit", label: "继承父会话" },
  { value: "off", label: "off" },
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
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

/* ---------- 子区块组件 ---------- */
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
  return <div className="mb-1"><Text variant="heading3" as="h3">{children}</Text></div>;
}

/* ---------- 页面 ---------- */
export default function PluginsVizPreview() {
  const [tab, setTab] = useState("viz");
  const [page, setPage] = useState("general");
  const [open, setOpen] = useState(true);
  const [fleetView, setFleetView] = useState(true);
  const [asyncWidget, setAsyncWidget] = useState(true);
  const [asyncDefault, setAsyncDefault] = useState(true);
  const [forceTopLevelAsync, setForceTopLevelAsync] = useState(false);
  const [waitTool, setWaitTool] = useState(true);
  const [completionBatch, setCompletionBatch] = useState(true);
  const [scopeHelpOpen, setScopeHelpOpen] = useState(false);
  const [scopeWatch, setScopeWatch] = useState(false);
  const [lsp, setLsp] = useState(true);
  const [autoFollow, setAutoFollow] = useState(false);
  const [missions, setMissions] = useState(true);
  const [schedules, setSchedules] = useState(true);
  const [defaultModel, setDefaultModel] = useState("deepseek-v4-pro");
  const [thinking, setThinking] = useState("high");
  const [reviewerModel, setReviewerModel] = useState("deepseek-v4-pro");
  const [oracleModel, setOracleModel] = useState("deepseek-v4-pro");
  const [selectedAgent, setSelectedAgent] = useState<string | null>("reviewer");
  const [saved, setSaved] = useState(false);

  const navPages = [
    { id: "general", label: "通用设置" },
    { id: "models", label: "模型路由" },
    { id: "agents", label: "Agent 管理" },
    { id: "workflow", label: "工作流编排" },
    { id: "watchdog", label: "Watchdog" },
    { id: "perms", label: "权限" },
    { id: "mission", label: "Mission 调度" },
  ];

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-dvh overflow-y-auto bg-kumo-base text-kumo-default p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-kumo-strong">设计图 v3 · pi-subagents 可视化配置</h1>
            <p className="text-sm text-kumo-subtle mt-1">
              真实组件实现（components/ui）· 可交互预览 · 后续 PluginsConfig 开发直接复用本结构
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open("/design", "_blank")}>← 组件库</Button>
          </div>
        </div>

        {/* ═══════════ 弹框模拟 ═══════════ */}
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger render={(p) => <Button {...p}>重新打开弹框预览</Button>} />
          <Dialog size="xl" className="sm:w-[860px] max-w-[calc(100vw-2rem)]">
            <Dialog.Title className="text-lg font-semibold">插件配置</Dialog.Title>
            <Dialog.Description className="font-mono text-xs text-kumo-subtle">
              ~/Codes/xuefei/pi-web-yuxi
            </Dialog.Description>

            <div className="flex gap-0 mt-3 border-t border-kumo-line flex-1 min-h-0">
              {/* 左侧插件列表（模拟现有结构） */}
              <div className="w-52 shrink-0 border-r border-kumo-line bg-kumo-tint p-2 hidden sm:block">
                <div className="text-xs font-semibold uppercase text-kumo-inactive px-2 py-1.5">global</div>
                {[
                  { src: "npm:pi-mcp-adapter", sub: "1 extension", active: false },
                  { src: "npm:pi-subagents", sub: "1 extension · 1 skill · 7 prompts · v0.42.1", active: true },
                  { src: "git:.../projectops", sub: "git 包", active: false },
                ].map((p) => (
                  <div
                    key={p.src}
                    className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer ${p.active ? "bg-kumo-tint" : "hover:bg-kumo-tint"}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-kumo-success shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-mono truncate ${p.active ? "text-kumo-default font-semibold" : "text-kumo-default"}`}>{p.src}</div>
                      <div className="text-xs text-kumo-inactive truncate">{p.sub}</div>
                    </div>
                    {p.active && <Badge variant="primary">可视化</Badge>}
                  </div>
                ))}
              </div>

              {/* 右侧：Tab 插件详情 | 可视化 */}
              <div className="flex-1 min-w-0 flex flex-col">
                <Tabs
                  variant="underline"
                  tabs={[
                    { value: "detail", label: "插件详情" },
                    { value: "viz", label: "可视化配置" },
                  ]}
                  value={tab}
                  onValueChange={(v) => setTab(String(v))}
                  className="px-4 pt-2 flex-shrink-0"
                />

                {tab === "detail" ? (
                  <div className="p-5 text-xs text-kumo-subtle">
                    （此处保持现有插件详情内容：启用开关、版本、资源统计、Update/Reload/Remove 按钮 —— 不做改动）
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0">
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
                              <SwitchRow title="FleetView 常驻面板" desc="编辑器下方显示运行中的子代理摘要 · fleetView" checked={fleetView} onChange={setFleetView} />
                              <SwitchRow title="异步运行小部件" desc="编辑器下方显示后台任务状态 · asyncWidget" checked={asyncWidget} onChange={setAsyncWidget} />
                              <SwitchRow title="完成通知批量合并" desc="后台任务同批完成时合并为一条静默通知 · completionBatch.enabled" checked={completionBatch} onChange={setCompletionBatch} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                              <Field label="FleetView 位置 · fleetViewPlacement">
                                <Select items={[{ value: "below", label: "belowEditor（下方）" }, { value: "above", label: "aboveEditor（上方）" }]} />
                              </Field>
                              <Field label="工具结果展示 · inlineToolDisplay">
                                <Select items={[{ value: "rich", label: "rich（动态展示）" }, { value: "summary", label: "summary（单行稳定）" }]} />
                              </Field>
                              <Field label="工具描述模式 · toolDescriptionMode">
                                <Select items={[{ value: "full", label: "full（完整描述）" }, { value: "compact", label: "compact（精简）" }, { value: "custom", label: "custom（自定义文件）" }]} />
                              </Field>
                            </div>
                          </Card>

                          <SectionLabel>运行行为</SectionLabel>
                          <Card>
                            <div className="px-4 py-1">
                              <SwitchRow title="默认后台运行" desc="workflowScript 未指定 async 时默认异步 · asyncByDefault" checked={asyncDefault} onChange={setAsyncDefault} />
                              <SwitchRow title="强制顶层异步" desc="顶层单/并行/链运行强制后台并跳过启动确认 · forceTopLevelAsync" checked={forceTopLevelAsync} onChange={setForceTopLevelAsync} />
                              <SwitchRow title="subagent_wait 阻塞等待" desc="关闭后 wait 工具直接返回不阻塞 · waitTool.enabled" checked={waitTool} onChange={setWaitTool} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                              <Field label="嵌套委派深度 · maxSubagentDepth" description="0 = 禁止嵌套，默认 2 层">
                                <Input type="number" defaultValue={2} className="w-full" />
                              </Field>
                              <Field label="会话内最大启动数 · maxSubagentSpawnsPerSession" description="0 = 不限制">
                                <Input type="number" defaultValue={0} className="w-full" />
                              </Field>
                              <Field label="全局并发上限 · globalConcurrencyLimit">
                                <Input type="number" defaultValue={20} className="w-full" />
                              </Field>
                              <Field label="并行任务数 · parallel.maxTasks">
                                <Input type="number" defaultValue={8} className="w-full" />
                              </Field>
                              <Field label="并行并发数 · parallel.concurrency">
                                <Input type="number" defaultValue={4} className="w-full" />
                              </Field>
                            </div>
                          </Card>

                          <SectionLabel>产物与存储</SectionLabel>
                          <Card className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Field label="产物目录策略 · artifactDir">
                                <Select items={[{ value: "project", label: "project（项目内 .pi-subagents/）" }, { value: "session", label: "session（pi 会话目录）" }, { value: "temp", label: "temp（系统临时）" }]} />
                              </Field>
                              <Field label="会话目录 · defaultSessionDir">
                                <Input value="~/.pi/agent/sessions/subagent/" className="w-full font-mono" />
                              </Field>
                              <Field label="worktree 基目录 · worktreeBaseDir" description="worktree: true 运行的隔离工作区">
                                <Input placeholder="默认系统临时目录" className="w-full font-mono" />
                              </Field>
                              <Field label="单次运行输出目录 · singleRunOutputBaseDir" description="相对 output 路径的根目录">
                                <Input value="~/.pi/subagent-outputs" className="w-full font-mono" />
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
                                    <Input placeholder="./scripts/setup-worktree.mjs" className="w-full font-mono" />
                                  </Field>
                                  <Field label="Hook 超时 · worktreeSetupHookTimeoutMs">
                                    <Input type="number" defaultValue={30000} className="w-full" />
                                  </Field>
                                  <Field label="intercom 桥接 · intercomBridge.mode">
                                    <Select items={[{ value: "always", label: "always（默认，始终注入）" }, { value: "fork-only", label: "fork-only（仅 fork 运行）" }, { value: "off", label: "off（关闭）" }]} />
                                  </Field>
                                  <Field label="操作确认策略 · authorityPolicy" description="6 个动作：auto / confirm / forbid（默认：discardWorktree·destructiveCleanup·spawnBudgetGrant=confirm，scheduleCreate·stopRun·steerRun=auto）">
                                    <Input value="discardWorktree: confirm, destructiveCleanup: confirm, spawnBudgetGrant: confirm, scheduleCreate: auto, stopRun: auto, steerRun: auto" className="w-full font-mono" />
                                  </Field>
                                  <Field label="回合预算默认 · turnBudget" description="如 {maxTurns:20, graceTurns:2} JSON 格式">
                                    <Input placeholder={'{"maxTurns":20,"graceTurns":2}'} className="w-full font-mono" />
                                  </Field>
                                  <Field label="工具调用预算 · toolBudget" description="如 {soft:40, hard:60} JSON 格式">
                                    <Input placeholder={'{"soft":40,"hard":60}'} className="w-full font-mono" />
                                  </Field>
                                  <Field label="用量预算 · usageBudget" description="如 {tokens:{hard:500000}, costUsd:{hard:5}} JSON 格式">
                                    <Input placeholder={'{"tokens":{"hard":500000},"costUsd":{"hard":5}}'} className="w-full font-mono" />
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
                              <SwitchRow title="禁用思考后缀" desc="provider 拒绝带 thinking 后缀的模型 id 时开启 · disableThinking" checked={false} onChange={() => {}} />
                              <SwitchRow title="禁用全部内置 agent" desc="隐藏所有内置角色，仅保留自定义 · disableBuiltins" checked={false} onChange={() => {}} />
                              <SwitchRow title="强制模型范围" desc="开启后白名单外的模型显式指定会报错 · modelScope.enforce" checked={false} onChange={() => {}} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                              <Field label="默认模型 · defaultModel" description="支持模糊匹配，如 anthropic/claude-sonnet-4">
                                <Select items={MODEL_ITEMS} value={defaultModel} onValueChange={(v) => setDefaultModel(String(v))} />
                              </Field>
                              <Field label="默认思考级别 · defaultThinking">
                                <Select items={THINKING_ITEMS} value={thinking} onValueChange={(v) => setThinking(String(v))} />
                              </Field>
                              <div className="sm:col-span-2">
                                <Field label="模型范围白名单 · modelScope.allow" description="glob 模式逗号分隔；未命中显式指定报错（enforce 开启时），继承来源仅警告">
                                  <Input value="anthropic/*, openai/gpt-5-*" className="w-full" />
                                </Field>
                              </div>
                              <div className="sm:col-span-2">
                                <Field label="默认扩展白名单 · defaultExtensions" description="未声明 extensions 的 agent 使用的扩展列表（空 = 禁用全部扩展）">
                                  <Input placeholder="./tools/research.ts, ./tools/guard.ts（逗号分隔）" className="w-full font-mono" />
                                </Field>
                              </div>
                            </div>
                          </Card>

                          <SectionLabel>
                            <div className="flex items-center justify-between">
                              <span>角色覆盖 · agentOverrides</span>
                              <Button variant="outline" size="xs">＋ 添加角色</Button>
                            </div>
                          </SectionLabel>
                          <Card>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-kumo-line text-left">
                                  <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">角色</th>
                                  <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">模型</th>
                                  <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">思考</th>
                                  <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">备用模型</th>
                                  <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">操作</th>
                                </tr>
                              </thead>
                              <tbody className="text-sm">
                                <tr className="border-b border-kumo-line">
                                  <td className="px-4 py-2.5">
                                    <span className="font-mono text-xs">reviewer</span>{" "}
                                    <Badge variant="success">已覆盖</Badge>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <Select size="sm" items={MODEL_ITEMS} value={reviewerModel} onValueChange={(v) => setReviewerModel(String(v))} />
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <Select size="sm" items={THINKING_ITEMS} value="high" />
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <Input size="sm" value="openai/gpt-5-mini" className="w-full font-mono" aria-label="reviewer 备用模型" />
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <Button variant="ghost" size="xs">编辑</Button>
                                    <Button variant="ghost" size="xs" className="text-kumo-danger">删除</Button>
                                  </td>
                                </tr>
                                <tr className="border-b border-kumo-line">
                                  <td className="px-4 py-2.5">
                                    <span className="font-mono text-xs">oracle</span>{" "}
                                    <Badge variant="success">已覆盖</Badge>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <Select size="sm" items={MODEL_ITEMS} value={oracleModel} onValueChange={(v) => setOracleModel(String(v))} />
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <Select size="sm" items={THINKING_ITEMS} value="high" />
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <Input size="sm" placeholder="限流/鉴权失败时降级" className="w-full font-mono" aria-label="oracle 备用模型" />
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <Button variant="ghost" size="xs">编辑</Button>
                                    <Button variant="ghost" size="xs" className="text-kumo-danger">删除</Button>
                                  </td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2.5">
                                    <span className="font-mono text-xs">worker</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-kumo-inactive" colSpan={4}>跟随全局默认（无覆盖）</td>
                                </tr>
                              </tbody>
                            </table>
                          </Card>

                          <SectionLabel>角色编辑（agentOverrides 全字段）</SectionLabel>
                          <Card className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Field label="覆盖描述 · description">
                                <Input placeholder="独立审查层级（列表展示用）" className="w-full" />
                              </Field>
                              <Field label="系统提示模式 · systemPromptMode">
                                <Select items={[{ value: "replace", label: "replace（替换基础提示）" }, { value: "append", label: "append（追加到基础提示）" }]} />
                              </Field>
                              <Field label="默认上下文 · defaultContext">
                                <Select items={[{ value: "inherit", label: "继承（agent 自身定义）" }, { value: "fresh", label: "fresh（全新上下文）" }, { value: "fork", label: "fork（分支父会话）" }]} />
                              </Field>
                              <Field label="验收角色 · acceptanceRole">
                                <Select items={[{ value: "auto", label: "自动推断" }, { value: "read-only", label: "read-only（只读）" }, { value: "writer", label: "writer（写）" }]} />
                              </Field>
                              <Field label="技能白名单 · skills" description="逗号分隔">
                                <Input placeholder="tmux, safe-bash" className="w-full font-mono" />
                              </Field>
                              <Field label="工具白名单 · tools" description="逗号分隔，覆盖 frontmatter">
                                <Input placeholder="read, grep, find, ls" className="w-full font-mono" />
                              </Field>
                              <Field label="系统提示覆盖 · systemPrompt" description="完整替换该角色的系统提示">
                                <Input placeholder="（留空 = 不覆盖）" className="w-full" />
                              </Field>
                            </div>
                            <div className="px-0 py-1 mt-2 border-t border-kumo-line">
                              <SwitchRow title="禁用该角色" desc="隐藏于运行时发现与列表 · disabled" checked={false} onChange={() => {}} />
                              <SwitchRow title="继承项目上下文" desc="读取 AGENTS.md 等项目指令 · inheritProjectContext" checked onChange={() => {}} />
                              <SwitchRow title="继承技能目录" desc="子代理可见 pi 的技能目录 · inheritSkills" checked={false} onChange={() => {}} />
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button variant="primary">保存覆盖</Button>
                              <Button variant="secondary">清除覆盖</Button>
                            </div>
                          </Card>

                          <SectionLabel>诊断与配置文件</SectionLabel>
                          <Card className="p-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="text-sm text-kumo-subtle">
                                查看当前生效的角色 → 模型映射（运行时状态，非配置）
                              </div>
                              <Button variant="secondary" size="sm">刷新映射（/subagents-models）</Button>
                            </div>
                            <div className="border-t border-kumo-line mt-3 pt-3">
                              <div className="text-xs font-semibold text-kumo-subtle mb-2">模型配置文件（provider 目录 → 角色分配）</div>
                              <div className="flex gap-2 flex-wrap">
                                <Button variant="secondary" size="sm">刷新 provider 模型目录</Button>
                                <Button variant="secondary" size="sm">生成配额/质量配置</Button>
                                <Button variant="secondary" size="sm">加载配置</Button>
                                <Button variant="secondary" size="sm">检查配置</Button>
                              </div>
                              <div className="text-xs text-kumo-inactive mt-2">
                                对应命令：/subagents-refresh-provider-models · /subagents-generate-profiles · /subagents-load-profile · /subagents-check-profile
                              </div>
                            </div>
                          </Card>
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
                                  <span
                                    className={`px-2 py-1 rounded-md border ${
                                      i === 0 ? "border-kumo-brand text-kumo-brand font-semibold" : "border-kumo-line bg-kumo-base"
                                    }`}
                                  >
                                    {a}
                                  </span>
                                  {i < 5 && <span className="text-kumo-inactive">→</span>}
                                </span>
                              ))}
                            </div>
                          </Card>

                          <SectionLabel>
                            <div className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-1.5">
                                角色卡片 · 作用域发现（内置 / 用户 / 项目）
                                <button
                                  onClick={() => setScopeHelpOpen(true)}
                                  title="作用域说明"
                                  aria-label="作用域说明"
                                  className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full text-kumo-subtle hover:text-kumo-brand hover:bg-kumo-tint cursor-pointer border-0"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                  </svg>
                                </button>
                              </span>
                              <div className="flex gap-1">
                                {["全部", "内置", "自定义"].map((s, i) => (
                                  <button
                                    key={s}
                                    className={`px-2.5 py-1 rounded-md text-xs cursor-pointer border-0 ${
                                      i === 0 ? "bg-kumo-brand text-white font-semibold" : "bg-transparent text-kumo-subtle hover:bg-kumo-tint"
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </SectionLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {AGENTS.map((a) => (
                              <div
                                key={a.name}
                                onClick={() => setSelectedAgent(a.name)}
                                className={`border rounded-lg p-3 cursor-pointer transition-colors bg-kumo-base ${
                                  selectedAgent === a.name ? "border-kumo-brand bg-kumo-brand/5" : "border-kumo-line hover:border-kumo-brand/60"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-semibold">{a.name}</span>
                                  <Badge variant="neutral">内置</Badge>
                                  {a.override && <Badge variant="success">覆盖中</Badge>}
                                  {a.name === "researcher" && <Badge variant="warning">需 pi-web-access</Badge>}
                                </div>
                                <div className="text-sm text-kumo-subtle mt-1.5">{a.desc}</div>
                                <div className="flex items-center gap-2 mt-2 text-xs font-mono text-kumo-inactive">
                                  {a.model}
                                  {a.tags.map((t) => (
                                    <span key={t} className="text-kumo-subtle">· {t}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {/* 自定义 agent 示例 */}
                            <div className="border border-dashed border-kumo-line rounded-lg p-3 bg-kumo-base">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-semibold">code-reviewer</span>
                                <Badge variant="info">自定义 · user</Badge>
                              </div>
                              <div className="text-sm text-kumo-subtle mt-1.5">团队代码审查角色（~/.pi/agent/agents/code-reviewer.md）</div>
                              <div className="flex items-center gap-2 mt-2 text-xs font-mono text-kumo-inactive">
                                claude-sonnet-4
                                <span className="text-kumo-subtle">· aliases: cr</span>
                                <span className="text-kumo-subtle">· memory: project</span>
                              </div>
                            </div>
                            <div className="border border-dashed border-kumo-line rounded-lg p-3 bg-kumo-base">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-semibold">api-designer</span>
                                <Badge variant="info">自定义 · project</Badge>
                              </div>
                              <div className="text-sm text-kumo-subtle mt-1.5">本项目 API 设计审查（.pi/agents/api-designer.md）</div>
                              <div className="flex items-center gap-2 mt-2 text-xs font-mono text-kumo-inactive">
                                deepseek-v4-pro
                                <span className="text-kumo-subtle">· 只读</span>
                                <span className="text-kumo-subtle">· 项目级配置</span>
                              </div>
                            </div>
                          </div>

                          <SectionLabel>编辑：{selectedAgent}（点击卡片切换）</SectionLabel>
                          <Card className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Field label="模型 · model">
                                <Select items={MODEL_ITEMS} value={reviewerModel} onValueChange={(v) => setReviewerModel(String(v))} />
                              </Field>
                              <Field label="备用模型 · fallbackModels" description="限流/鉴权失败时按序降级">
                                <Input placeholder="openai/gpt-5-mini, anthropic/claude-sonnet-4" className="font-mono w-full" />
                              </Field>
                              <Field label="思考级别 · thinking">
                                <Select items={THINKING_ITEMS} value="high" />
                              </Field>
                              <Field label="别名 · aliases" description="逗号分隔，别名解析到本角色">
                                <Input placeholder="code-reviewer, cr" className="font-mono w-full" />
                              </Field>
                              <Field label="默认上下文 · defaultContext">
                                <Select items={[{ value: "inherit", label: "继承（frontmatter 定义）" }, { value: "fresh", label: "fresh（全新）" }, { value: "fork", label: "fork（分支父会话）" }]} />
                              </Field>
                              <Field label="超时 · timeoutMs">
                                <Input type="number" placeholder="900000（默认 30 分钟）" className="w-full" />
                              </Field>
                              <div className="sm:col-span-2">
                                <Field label="工具白名单 · tools">
                                  <Input value="read, grep, find, ls" className="font-mono w-full" />
                                </Field>
                              </div>
                              <div className="sm:col-span-2">
                                <Field label="持久记忆 · memory" description="每角色记忆（MEMORY.md 注入），scope: project/user + path">
                                  <div className="flex gap-2">
                                    <div className="w-32"><Select size="sm" items={[{ value: "off", label: "关闭" }, { value: "project", label: "project" }, { value: "user", label: "user" }]} value="off" /></div>
                                    <div className="flex-1"><Input placeholder="记忆路径，如 security-reviewer" className="font-mono w-full" /></div>
                                  </div>
                                </Field>
                              </div>
                            </div>
                            <div className="px-0 pt-2 mt-3 border-t border-kumo-line">
                              <SwitchRow title="默认后台运行 · async" desc="单 agent 启动默认进入后台（调用未指定 async 时）" checked={false} onChange={() => {}} />
                              <SwitchRow title="默认 fork 上下文" desc="启动未指定 context 时使用 fork（worker/oracle/advisor 默认开启）" checked onChange={() => {}} />
                            </div>
                            <div className="flex gap-2 mt-3 flex-wrap">
                              <Button variant="primary">保存覆盖</Button>
                              <Button variant="secondary">eject 抽出</Button>
                              <Button variant="secondary">reset 恢复</Button>
                              <Button variant="secondary">enable 恢复</Button>
                              <Button variant="destructive">disable</Button>
                              <Button variant="destructive">delete（仅自定义）</Button>
                            </div>
                            <div className="text-xs text-kumo-inactive mt-2">
                              作用域操作：eject / disable / enable / reset 支持 agentScope（user / project）——项目覆盖优先于用户覆盖
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
                              { name: "单代理委派", desc: "一个子代理完成任务", code: "runs.run(agent)" },
                              { name: "顺序链", desc: "上一步输出作下一步输入", code: "scout → worker → reviewer" },
                              { name: "并行扇出", desc: "多个独立审查同时进行", code: "runs.all ×3 reviewer" },
                            ].map((t, i) => (
                              <div
                                key={t.name}
                                className={`border rounded-lg p-3 cursor-pointer bg-kumo-base ${i === 0 ? "border-kumo-brand bg-kumo-brand/5" : "border-kumo-line hover:border-kumo-brand/60"}`}
                              >
                                <div className="text-base font-semibold">{t.name}</div>
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
                            <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto">
{`// 并行审查扇出：三个独立角度
const scan = await runs.run("scan", { agent: "scout", task: "扫描代码库结构" });
const reviews = await runs.all([
  { key: "correctness", agent: "reviewer", task: "审查正确性: " + scan.output },
  { key: "tests",       agent: "reviewer", task: "审查测试: " + scan.output },
  { key: "simplicity",  agent: "reviewer", task: "审查简洁性: " + scan.output }
]);
return reviews.map(r => r.output);`}
                            </pre>
                          </Card>

                          <SectionLabel>流水线预览 · 自动解析</SectionLabel>
                          <Card className="p-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="border border-kumo-line bg-kumo-base rounded-md px-3 py-2">
                                <div className="text-xs font-mono text-kumo-inactive">step 1</div>
                                <div className="text-sm font-semibold mt-0.5">scout</div>
                                <div className="text-xs text-kumo-subtle mt-0.5">扫描代码库结构</div>
                              </div>
                              <span className="text-kumo-inactive">→</span>
                              <div className="border border-dashed border-kumo-brand bg-kumo-brand/5 rounded-md px-3 py-2">
                                <div className="text-xs font-mono text-kumo-brand">并行 ×3 · runs.all</div>
                                <div className="flex gap-1.5 mt-2">
                                  {["correctness", "tests", "simplicity"].map((k, i) => (
                                    <div key={k} className={`border rounded px-2 py-1.5 bg-kumo-base ${i === 2 ? "border-kumo-brand" : "border-kumo-line"}`}>
                                      <div className="text-xs font-semibold">reviewer</div>
                                      <div className="text-xs text-kumo-inactive">{k}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <span className="text-kumo-inactive">→</span>
                              <div className="border border-kumo-line bg-kumo-base rounded-md px-3 py-2">
                                <div className="text-xs font-mono text-kumo-inactive">return</div>
                                <div className="text-sm font-semibold mt-0.5">聚合结果</div>
                                <div className="text-xs text-kumo-subtle mt-0.5">3 个审查输出</div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}

                      {/* ══════ Watchdog ══════ */}
                      {page === "watchdog" && (
                        <div>
<PageHeading>Watchdog</PageHeading>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                            {[
                              { label: "状态", value: <Badge variant="success">● 已启用</Badge> },
                              { label: "审查模型", value: <span className="font-mono text-xs">claude-opus-4-8</span> },
                              { label: "上次审查", value: "2 分钟前" },
                              { label: "LSP 诊断", value: <span className="text-xs">正常 · 2 文件</span> },
                            ].map((s) => (
                              <div key={s.label} className="border border-kumo-line rounded-lg p-3 bg-kumo-base">
                                <div className="text-xs text-kumo-inactive">{s.label}</div>
                                <div className="text-base font-semibold mt-1">{s.value}</div>
                              </div>
                            ))}
                          </div>

                          <SectionLabel>配置 · subagents.watchdog</SectionLabel>
                          <Card>
                            <div className="px-4 py-1">
                              <SwitchRow title="启用 Watchdog" desc="agent_end 且 repo 有改动时触发对抗性审查 · enabled" checked={lsp} onChange={setLsp} />
                              <SwitchRow title="Scope 监控" desc="记录当前目标，标记 scope-drift · scope.enabled" checked={scopeWatch} onChange={setScopeWatch} />
                              <SwitchRow title="LSP 诊断" desc="审查前对变更的 TS/JS 文件跑语言服务器 · lsp.enabled" checked={lsp} onChange={setLsp} />
                              <SwitchRow title="Auto-follow" desc="发现 blocker 时自动排队后续消息让 agent 处理" checked={autoFollow} onChange={setAutoFollow} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                              <Field label="主审查模型 · main.model">
                                <div className="flex gap-2 min-w-0">
                                  <div className="flex-1 min-w-0"><Input value="anthropic/claude-opus-4-8" className="font-mono w-full" /></div>
                                  <Button variant="secondary" className="shrink-0">✨ 推荐</Button>
                                </div>
                              </Field>
                              <Field label="审查节奏 · cadence.everyNTools" description="0 = 仅 agent_end 审查">
                                <Input type="number" defaultValue={0} className="w-full" />
                              </Field>
                            </div>
                          </Card>

                          <SectionLabel>审查历史</SectionLabel>
                          <Card className="px-4 py-2">
                            {[
                              { time: "10:12", title: "审查通过", tags: <><Badge variant="info">worker</Badge> <span className="text-kumo-inactive">3 文件变更</span></>, detail: "无 blocker；1 条 concern（未使用变量）" },
                              { time: "09:47", title: "发现 blocker", tags: <Badge variant="warning">scope-drift</Badge>, detail: "改动超出当前目标范围 → auto-follow 已排队" },
                              { time: "昨天", title: "审查通过", tags: <span className="text-kumo-inactive">LSP 警告 3</span>, detail: "TS 诊断 3 个警告，无错误" },
                            ].map((h) => (
                              <div key={h.time} className="flex gap-3 py-2.5 border-b border-kumo-line last:border-0">
                                <span className="text-xs font-mono text-kumo-inactive shrink-0 pt-0.5">{h.time}</span>
                                <div>
                                  <div className="text-sm flex items-center gap-2">{h.title} {h.tags}</div>
                                  <div className="text-xs text-kumo-subtle mt-0.5">{h.detail}</div>
                                </div>
                              </div>
                            ))}
                          </Card>
                        </div>
                      )}

                      {/* ══════ 权限 ══════ */}
                      {page === "perms" && (
                        <div>
<PageHeading>权限</PageHeading>

                          <div className="text-sm text-kumo-subtle mb-3">
                            原生权限门（bash 除外）：allow / ask / deny · 写入 config.json → permissions
                          </div>
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
                                <tr className="border-b border-kumo-line">
                                  <td className="px-4 py-2.5 font-mono text-xs">read</td>
                                  <td className="px-4 py-2.5"><Select size="sm" items={[{ value: "allow", label: "allow" }, { value: "ask", label: "ask" }, { value: "deny", label: "deny" }]} value="allow" /></td>
                                  <td className="px-4 py-2.5 text-xs text-kumo-subtle">全局默认</td>
                                </tr>
                                <tr className="border-b border-kumo-line">
                                  <td className="px-4 py-2.5 font-mono text-xs">write</td>
                                  <td className="px-4 py-2.5"><Select size="sm" items={[{ value: "allow", label: "allow" }, { value: "ask", label: "ask" }, { value: "deny", label: "deny" }]} value="ask" /></td>
                                  <td className="px-4 py-2.5 text-xs text-kumo-subtle">调用时由子 watchdog 仲裁（预览 + 批准/拒绝）</td>
                                </tr>
                                <tr className="border-b border-kumo-line">
                                  <td className="px-4 py-2.5 font-mono text-xs">edit</td>
                                  <td className="px-4 py-2.5"><Select size="sm" items={[{ value: "allow", label: "allow" }, { value: "ask", label: "ask" }, { value: "deny", label: "deny" }]} value="deny" /></td>
                                  <td className="px-4 py-2.5 text-xs text-kumo-subtle">子代理禁止编辑</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2.5 font-mono text-xs">bash</td>
                                  <td className="px-4 py-2.5"><Badge variant="neutral">不受管</Badge></td>
                                  <td className="px-4 py-2.5 text-xs text-kumo-subtle">始终放行；命令级策略需 pi-guard</td>
                                </tr>
                              </tbody>
                            </table>
                          </Card>
                          <div className="mt-3">
                            <Button variant="outline" size="xs">＋ 添加工具规则</Button>
                          </div>
                        </div>
                      )}

                      {/* ══════ Mission 调度 ══════ */}
                      {page === "mission" && (
                        <div>
<PageHeading>Mission 调度</PageHeading>

                          <SectionLabel>Mission · missions</SectionLabel>
                          <Card>
                            <div className="px-4 py-1">
                              <SwitchRow title="自动创建 Mission · missions.enabled" desc="普通任务启动时自动创建持久记录（目标/运行/收据）" checked={missions} onChange={setMissions} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                              <Field label="存储目录 · missions.directory">
                                <Input value=".pi-subagents/missions" className="font-mono w-full" />
                              </Field>
                              <Field label="保留终端记录 · retainTerminal">
                                <Input type="number" defaultValue={200} className="w-full" />
                              </Field>
                            </div>
                          </Card>

                          <SectionLabel>
                            <div className="flex items-center justify-between">
                              <span>定时调度 · scheduledRuns</span>
                              <Button variant="outline" size="xs">＋ 新建调度</Button>
                            </div>
                          </SectionLabel>
                          <Card>
                            <div className="px-4 py-1">
                              <SwitchRow title="启用调度 · scheduledRuns.enabled" desc="支持 at:+30m 一次性 / every:6h 周期" checked={schedules} onChange={setSchedules} />
                            </div>
                            <table className="w-full text-sm border-t border-kumo-line">
                              <thead>
                                <tr className="border-b border-kumo-line text-left">
                                  <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">名称</th>
                                  <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">触发</th>
                                  <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">代理</th>
                                  <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">状态</th>
                                  <th className="px-4 py-2 text-xs font-semibold text-kumo-inactive">操作</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-kumo-line">
                                  <td className="px-4 py-2.5">每日代码审查</td>
                                  <td className="px-4 py-2.5 font-mono text-xs">every 6h</td>
                                  <td className="px-4 py-2.5 font-mono text-xs">reviewer</td>
                                  <td className="px-4 py-2.5"><Badge variant="success">active</Badge></td>
                                  <td className="px-4 py-2.5">
                                    <Button variant="ghost" size="xs">暂停</Button>
                                    <Button variant="ghost" size="xs">运行</Button>
                                    <Button variant="ghost" size="xs" className="text-kumo-danger">删除</Button>
                                  </td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2.5">晚间审查</td>
                                  <td className="px-4 py-2.5 font-mono text-xs">一次性 +30m</td>
                                  <td className="px-4 py-2.5 font-mono text-xs">reviewer</td>
                                  <td className="px-4 py-2.5"><Badge variant="warning">pending</Badge></td>
                                  <td className="px-4 py-2.5"><Button variant="ghost" size="xs">取消</Button></td>
                                </tr>
                              </tbody>
                            </table>
                          </Card>
                        </div>
                      )}
                    </div>

                    {/* 底部操作条 */}
                    <div className="flex items-center justify-between px-5 py-2.5 border-t border-kumo-line flex-shrink-0">
                      <span className="text-sm font-mono text-kumo-inactive">
                        settings.json → subagents · config.json
                      </span>
                      <div className="flex gap-2">
                        <Button variant="secondary">恢复默认</Button>
                        <Button variant="primary" onClick={save}>{saved ? "✓ 已保存" : "保存"}</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Dialog>
        </Dialog.Root>

        {/* 作用域解释弹框 */}
        <Dialog.Root open={scopeHelpOpen} onOpenChange={setScopeHelpOpen}>
          <Dialog size="lg">
            <Dialog.Title>Agent 作用域 · 大白话</Dialog.Title>
            <Dialog.Description>一份 agent = 一份角色说明书（md 文件），放在哪个目录就是它的作用域</Dialog.Description>
            <div className="space-y-3 text-sm py-2">
              <div className="border border-kumo-line rounded-lg overflow-hidden">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-16" />
                    <col className="w-44" />
                    <col />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-kumo-line text-left">
                      <th className="px-3 py-2 text-xs font-semibold text-kumo-inactive">作用域</th>
                      <th className="px-3 py-2 text-xs font-semibold text-kumo-inactive">存放位置</th>
                      <th className="px-3 py-2 text-xs font-semibold text-kumo-inactive">大白话</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-kumo-line align-top">
                      <td className="px-3 py-2 text-xs font-semibold">内置</td>
                      <td className="px-3 py-2 text-[11px] font-mono text-kumo-subtle break-all">插件自带 agents/</td>
                      <td className="px-3 py-2 text-xs text-kumo-subtle">出厂自带 9 个角色（scout/reviewer…），人人都有</td>
                    </tr>
                    <tr className="border-b border-kumo-line align-top">
                      <td className="px-3 py-2 text-xs font-semibold">插件包</td>
                      <td className="px-3 py-2 text-[11px] font-mono text-kumo-subtle break-all">包的 pi-subagents.agents</td>
                      <td className="px-3 py-2 text-xs text-kumo-subtle">应用商店 App 自带的组件</td>
                    </tr>
                    <tr className="border-b border-kumo-line align-top">
                      <td className="px-3 py-2 text-xs font-semibold">用户</td>
                      <td className="px-3 py-2 text-[11px] font-mono text-kumo-subtle break-all">~/.pi/agent/agents/</td>
                      <td className="px-3 py-2 text-xs text-kumo-subtle">你自己下载的 App——所有项目通用，换项目还在</td>
                    </tr>
                    <tr className="align-top">
                      <td className="px-3 py-2 text-xs font-semibold">项目</td>
                      <td className="px-3 py-2 text-[11px] font-mono text-kumo-subtle break-all">.pi/agents/</td>
                      <td className="px-3 py-2 text-xs text-kumo-subtle">公司给这个项目专用——只在当前项目生效</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="border border-kumo-brand/30 bg-kumo-brand/5 rounded-lg px-3 py-2.5 text-sm text-kumo-default">
                <b>规则一句话：近的盖远的。</b>
                <span className="text-kumo-subtle">{" "}项目 &gt; 用户 &gt; 插件包 &gt; 内置。同一个名字（如 reviewer）在多个作用域都有说明书时，高优先级那份生效——内置 9 个只是最底层地基，谁都能在上层放同名说明书把它顶掉。</span>
              </div>
              <div className="text-sm text-kumo-subtle px-1">
                例：用户抽屉放了 reviewer（用更好的模型）→ 所有项目用你的版本；某项目再放一份 reviewer（只查安全）→ 只有那个项目用项目版。
              </div>
            </div>
            <Dialog.Close render={(p) => <Button variant="secondary" {...p}>知道了</Button>} />
          </Dialog>
        </Dialog.Root>
      </div>
    </div>
  );
}
