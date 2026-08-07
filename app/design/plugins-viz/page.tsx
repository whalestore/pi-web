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
import { Button, Field, Input, Select, Switch, Badge, Dialog, Tabs } from "@/components/ui";

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
        <div className="text-sm text-kumo-default">{title}</div>
        <div className="text-xs text-kumo-subtle mt-0.5">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} label={title} />
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border border-kumo-line rounded-lg overflow-hidden ${className}`}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-wide text-kumo-subtle mt-5 mb-2">{children}</div>;
}

/* ---------- 页面 ---------- */
export default function PluginsVizPreview() {
  const [tab, setTab] = useState("viz");
  const [page, setPage] = useState("general");
  const [open, setOpen] = useState(true);
  const [fleetView, setFleetView] = useState(true);
  const [asyncWidget, setAsyncWidget] = useState(true);
  const [asyncDefault, setAsyncDefault] = useState(true);
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
            <h1 className="text-base font-bold">设计图 v3 · pi-subagents 可视化配置</h1>
            <p className="text-xs text-kumo-subtle mt-1">
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
            <Dialog.Title>插件配置</Dialog.Title>
            <Dialog.Description className="font-mono text-xs text-kumo-subtle">
              ~/Codes/xuefei/pi-web-yuxi
            </Dialog.Description>

            <div className="flex gap-0 -mx-6 mt-3 border-t border-kumo-line" style={{ minHeight: 420 }}>
              {/* 左侧插件列表（模拟现有结构） */}
              <div className="w-52 shrink-0 border-r border-kumo-line bg-kumo-tint p-2 hidden sm:block">
                <div className="text-[10px] font-semibold uppercase text-kumo-inactive px-2 py-1.5">global</div>
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
                      <div className="text-[10px] text-kumo-inactive truncate">{p.sub}</div>
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
                  className="px-4 pt-2"
                />

                {tab === "detail" ? (
                  <div className="p-5 text-xs text-kumo-subtle">
                    （此处保持现有插件详情内容：启用开关、版本、资源统计、Update/Reload/Remove 按钮 —— 不做改动）
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* 顶部分类导航 */}
                    <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-kumo-line">
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
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                      {/* ══════ 通用设置 ══════ */}
                      {page === "general" && (
                        <div>
                          <SectionLabel>UI 展示</SectionLabel>
                          <Card>
                            <div className="px-4 py-1">
                              <SwitchRow title="FleetView 常驻面板" desc="编辑器下方显示运行中的子代理摘要 · fleetView" checked={fleetView} onChange={setFleetView} />
                              <SwitchRow title="异步运行小部件" desc="编辑器下方显示后台任务状态 · asyncWidget" checked={asyncWidget} onChange={setAsyncWidget} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                              <Field label="FleetView 位置 · fleetViewPlacement">
                                <Select items={[{ value: "below", label: "belowEditor（下方）" }, { value: "above", label: "aboveEditor（上方）" }]} />
                              </Field>
                              <Field label="工具结果展示 · inlineToolDisplay">
                                <Select items={[{ value: "rich", label: "rich（动态）" }, { value: "summary", label: "summary（单行）" }]} />
                              </Field>
                            </div>
                          </Card>

                          <SectionLabel>运行行为</SectionLabel>
                          <Card>
                            <div className="px-4 py-1">
                              <SwitchRow title="默认后台运行" desc="workflowScript 未指定 async 时默认异步 · asyncByDefault" checked={asyncDefault} onChange={setAsyncDefault} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                              <Field label="嵌套委派深度 · maxSubagentDepth" description="0 = 禁止嵌套">
                                <Input type="number" defaultValue={2} />
                              </Field>
                              <Field label="并行上限 · parallel.maxTasks">
                                <Input type="number" defaultValue={8} />
                              </Field>
                            </div>
                          </Card>

                          <SectionLabel>产物与存储</SectionLabel>
                          <Card className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Field label="产物目录策略 · artifactDir">
                                <Select items={[{ value: "project", label: "project（项目内 .pi-subagents/）" }, { value: "session", label: "session" }, { value: "temp", label: "temp" }]} />
                              </Field>
                              <Field label="worktree 基目录 · worktreeBaseDir">
                                <Input placeholder="默认系统临时目录" />
                              </Field>
                            </div>
                          </Card>
                        </div>
                      )}

                      {/* ══════ 模型路由 ══════ */}
                      {page === "models" && (
                        <div>
                          <div className="text-xs text-kumo-subtle mb-3">
                            优先级：运行参数 &gt; agent 定义 &gt; 角色覆盖 &gt; 全局默认 &gt; 父会话 · 写入 settings.json → subagents
                          </div>
                          <SectionLabel>全局默认</SectionLabel>
                          <Card className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Field label="默认模型 · defaultModel" description="支持模糊匹配">
                                <Select items={MODEL_ITEMS} value={defaultModel} onValueChange={(v) => setDefaultModel(String(v))} />
                              </Field>
                              <Field label="默认思考级别 · defaultThinking">
                                <Select items={THINKING_ITEMS} value={thinking} onValueChange={(v) => setThinking(String(v))} />
                              </Field>
                              <div className="sm:col-span-2">
                                <Field label="模型范围白名单 · modelScope.allow" description="glob 模式逗号分隔；未命中显式指定报错，继承来源仅警告">
                                  <Input value="anthropic/*, openai/gpt-5-*" />
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
                                  <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">角色</th>
                                  <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">模型</th>
                                  <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">思考</th>
                                  <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">操作</th>
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
                                    <Button variant="ghost" size="xs">编辑</Button>
                                    <Button variant="ghost" size="xs" className="text-kumo-danger">删除</Button>
                                  </td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2.5">
                                    <span className="font-mono text-xs">worker</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-kumo-inactive" colSpan={3}>跟随全局默认（无覆盖）</td>
                                </tr>
                              </tbody>
                            </table>
                          </Card>
                        </div>
                      )}

                      {/* ══════ Agent 管理 ══════ */}
                      {page === "agents" && (
                        <div>
                          <SectionLabel>推荐委派流转（官方循环）</SectionLabel>
                          <Card className="p-3 bg-kumo-tint">
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
                            <div className="flex items-center justify-between">
                              <span>角色卡片</span>
                              <Button variant="outline" size="xs">＋ 新建自定义 Agent</Button>
                            </div>
                          </SectionLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {AGENTS.map((a) => (
                              <div
                                key={a.name}
                                onClick={() => setSelectedAgent(a.name)}
                                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                  selectedAgent === a.name ? "border-kumo-brand bg-kumo-brand/5" : "border-kumo-line hover:border-kumo-brand/60"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{a.name}</span>
                                  <Badge variant="neutral">内置</Badge>
                                  {a.override && <Badge variant="success">覆盖中</Badge>}
                                </div>
                                <div className="text-xs text-kumo-subtle mt-1.5">{a.desc}</div>
                                <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-kumo-inactive">
                                  {a.model}
                                  {a.tags.map((t) => (
                                    <span key={t} className="text-kumo-subtle">· {t}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <SectionLabel>编辑：{selectedAgent}（点击卡片切换）</SectionLabel>
                          <Card className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Field label="模型 · model">
                                <Select items={MODEL_ITEMS} value={reviewerModel} onValueChange={(v) => setReviewerModel(String(v))} />
                              </Field>
                              <Field label="思考级别 · thinking">
                                <Select items={THINKING_ITEMS} value="high" />
                              </Field>
                              <div className="sm:col-span-2">
                                <Field label="工具白名单 · tools">
                                  <Input value="read, grep, find, ls" className="font-mono" />
                                </Field>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button variant="primary">保存覆盖</Button>
                              <Button variant="secondary">eject 抽出</Button>
                              <Button variant="secondary">reset 恢复</Button>
                              <Button variant="destructive">disable</Button>
                            </div>
                          </Card>
                        </div>
                      )}

                      {/* ══════ 工作流编排 ══════ */}
                      {page === "workflow" && (
                        <div>
                          <SectionLabel>模板库（点击插入 workflowScript）</SectionLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                              { name: "单代理委派", desc: "一个子代理完成任务", code: "runs.run(agent)" },
                              { name: "顺序链", desc: "上一步输出作下一步输入", code: "scout → worker → reviewer" },
                              { name: "并行扇出", desc: "多个独立审查同时进行", code: "runs.all ×3 reviewer" },
                            ].map((t, i) => (
                              <div
                                key={t.name}
                                className={`border rounded-lg p-3 cursor-pointer ${i === 0 ? "border-kumo-brand bg-kumo-brand/5" : "border-kumo-line hover:border-kumo-brand/60"}`}
                              >
                                <div className="text-sm font-semibold">{t.name}</div>
                                <div className="text-xs text-kumo-subtle mt-1">{t.desc}</div>
                                <div className="text-[10px] font-mono text-kumo-inactive mt-2">{t.code}</div>
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
                          <Card className="p-4 bg-kumo-tint">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="border border-kumo-line bg-kumo-base rounded-md px-3 py-2">
                                <div className="text-[10px] font-mono text-kumo-inactive">step 1</div>
                                <div className="text-xs font-semibold mt-0.5">scout</div>
                                <div className="text-[10px] text-kumo-subtle mt-0.5">扫描代码库结构</div>
                              </div>
                              <span className="text-kumo-inactive">→</span>
                              <div className="border border-dashed border-kumo-brand bg-kumo-brand/5 rounded-md px-3 py-2">
                                <div className="text-[10px] font-mono text-kumo-brand">并行 ×3 · runs.all</div>
                                <div className="flex gap-1.5 mt-2">
                                  {["correctness", "tests", "simplicity"].map((k, i) => (
                                    <div key={k} className={`border rounded px-2 py-1.5 bg-kumo-base ${i === 2 ? "border-kumo-brand" : "border-kumo-line"}`}>
                                      <div className="text-[11px] font-semibold">reviewer</div>
                                      <div className="text-[9px] text-kumo-inactive">{k}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <span className="text-kumo-inactive">→</span>
                              <div className="border border-kumo-line bg-kumo-base rounded-md px-3 py-2">
                                <div className="text-[10px] font-mono text-kumo-inactive">return</div>
                                <div className="text-xs font-semibold mt-0.5">聚合结果</div>
                                <div className="text-[10px] text-kumo-subtle mt-0.5">3 个审查输出</div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}

                      {/* ══════ Watchdog ══════ */}
                      {page === "watchdog" && (
                        <div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                            {[
                              { label: "状态", value: <Badge variant="success">● 已启用</Badge> },
                              { label: "审查模型", value: <span className="font-mono text-xs">claude-opus-4-8</span> },
                              { label: "上次审查", value: "2 分钟前" },
                              { label: "LSP 诊断", value: <span className="text-xs">正常 · 2 文件</span> },
                            ].map((s) => (
                              <div key={s.label} className="border border-kumo-line rounded-lg p-3 bg-kumo-tint">
                                <div className="text-[10px] text-kumo-inactive">{s.label}</div>
                                <div className="text-sm font-semibold mt-1">{s.value}</div>
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
                                <div className="flex gap-2">
                                  <div className="flex-1"><Input value="anthropic/claude-opus-4-8" className="font-mono" /></div>
                                  <Button variant="secondary">✨ 推荐</Button>
                                </div>
                              </Field>
                              <Field label="审查节奏 · cadence.everyNTools" description="0 = 仅 agent_end 审查">
                                <Input type="number" defaultValue={0} />
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
                                <span className="text-[10px] font-mono text-kumo-inactive shrink-0 pt-0.5">{h.time}</span>
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
                          <div className="text-xs text-kumo-subtle mb-3">
                            原生权限门（bash 除外）：allow / ask / deny · 写入 config.json → permissions
                          </div>
                          <Card>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-kumo-line text-left">
                                  <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">工具</th>
                                  <th className="px-4 py-2 text-xs font-medium text-kumo-inactive w-40">策略</th>
                                  <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">说明</th>
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
                          <SectionLabel>Mission · missions</SectionLabel>
                          <Card>
                            <div className="px-4 py-1">
                              <SwitchRow title="自动创建 Mission · missions.enabled" desc="普通任务启动时自动创建持久记录（目标/运行/收据）" checked={missions} onChange={setMissions} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-kumo-line">
                              <Field label="存储目录 · missions.directory">
                                <Input value=".pi-subagents/missions" className="font-mono" />
                              </Field>
                              <Field label="保留终端记录 · retainTerminal">
                                <Input type="number" defaultValue={200} />
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
                                  <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">名称</th>
                                  <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">触发</th>
                                  <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">代理</th>
                                  <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">状态</th>
                                  <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">操作</th>
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
                    <div className="flex items-center justify-between px-5 py-2.5 border-t border-kumo-line">
                      <span className="text-[10px] font-mono text-kumo-inactive">
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
      </div>
    </div>
  );
}
