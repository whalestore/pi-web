"use client";

/**
 * pi-web 组件库设计页 —— http://127.0.0.1:37377/design
 *
 * 标准来源：@cloudflare/kumo（Base UI + Tailwind v4）
 * 微调层：components/ui/（默认值微调 + 组合）
 * 标准文档：docs/UI-COMPONENTS.md
 *
 * 所有新 UI 开发前先在这里查看组件形态。
 */
import { useState } from "react";
import { Button, Field, Input, Select, Switch, Badge, Dialog, Tabs } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";

function Section({
  title,
  desc,
  code,
  children,
}: {
  title: string;
  desc: string;
  code: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-kumo-line rounded-lg overflow-hidden bg-kumo-base">
      <div className="px-4 py-3 border-b border-kumo-line">
        <div className="text-sm font-semibold text-kumo-default">{title}</div>
        <div className="text-xs text-kumo-subtle mt-0.5">{desc}</div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="p-5 flex items-start flex-wrap gap-3 content-start bg-kumo-base">{children}</div>
        <div className="p-4 border-t lg:border-t-0 lg:border-l border-kumo-line bg-kumo-tint">
          <pre className="text-[11px] leading-relaxed text-kumo-subtle overflow-x-auto whitespace-pre-wrap break-words font-mono">
            {code}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function DesignPage() {
  const { theme, toggleTheme } = useTheme();
  const [switchOn, setSwitchOn] = useState(true);
  const [selectVal, setSelectVal] = useState("high");
  const [inputVal, setInputVal] = useState("deepseek-v4-pro");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState("viz");

  const badgeRow = (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="primary">primary</Badge>
      <Badge variant="success">success · 已覆盖</Badge>
      <Badge variant="warning">warning · 待处理</Badge>
      <Badge variant="error">error · 错误</Badge>
      <Badge variant="neutral">neutral · 内置</Badge>
      <Badge variant="info">info</Badge>
      <Badge variant="success" appearance="dot">dot 样式</Badge>
    </div>
  );

  return (
    <div className="h-dvh overflow-y-auto bg-kumo-base text-kumo-default">
      {/* 顶栏 */}
      <header className="sticky top-0 z-10 border-b border-kumo-line bg-kumo-tint/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-base font-bold">pi-web UI 组件库</h1>
            <span className="text-xs text-kumo-subtle">标准来源 @cloudflare/kumo · 微调层 components/ui</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => toggleTheme()}>
            {theme === "dark" ? "🌙 暗色" : "☀️ 亮色"} · 点击切换
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* 说明横幅 */}
        <div className="border border-kumo-brand/30 bg-kumo-brand/10 rounded-lg px-4 py-3 text-xs text-kumo-default leading-relaxed flex items-center justify-between gap-4">
          <span>
            <b>使用规范：</b>所有新 UI 一律从 <code className="font-mono text-kumo-brand">@/components/ui</code> 导入；
            颜色只用语义 token（kumo-*），禁止内联 style 与硬编码 hex；
            标准文档见 <code className="font-mono text-kumo-brand">docs/UI-COMPONENTS.md</code>。
          </span>
          <a href="/design/plugins-viz" className="shrink-0">
            <Button variant="primary" size="sm">🎨 设计图 v3：插件可视化配置预览</Button>
          </a>
        </div>

        {/* 主题色板 */}
        <div className="border border-kumo-line rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-kumo-line">
            <div className="text-sm font-semibold">语义色板（kumo tokens）</div>
            <div className="text-xs text-kumo-subtle mt-0.5">主题微调：brand 对齐 pi-web accent 蓝（亮 #2563eb / 暗 #60a5fa）</div>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["bg-kumo-brand", "brand / 主操作"],
              ["bg-kumo-tint", "tint / 面板底"],
              ["bg-kumo-line", "line / 边框"],
              ["bg-kumo-success", "success"],
              ["bg-kumo-warning", "warning"],
              ["bg-kumo-danger", "danger"],
              ["bg-kumo-info", "info"],
              ["bg-kumo-base", "base / 页面背景"],
            ].map(([cls, label]) => (
              <div key={cls} className="rounded-lg border border-kumo-line p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-md ${cls}`} />
                <div className="min-w-0">
                  <div className="text-xs font-mono text-kumo-default">{cls.split("-").slice(1).join("-")}</div>
                  <div className="text-[11px] text-kumo-subtle truncate">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Button */}
        <Section
          title="Button 按钮"
          desc="variant: primary / secondary / outline / ghost / destructive · 默认 size=sm（微调）"
          code={`<Button variant="primary">保存</Button>
<Button variant="secondary">取消</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">删除</Button>
<Button loading>提交中…</Button>`}
        >
          <Button variant="primary">保存</Button>
          <Button variant="secondary">取消</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">删除</Button>
          <Button loading>提交中…</Button>
          <Button size="xs">小尺寸</Button>
          <Button size="lg">大尺寸</Button>
        </Section>

        {/* Input + Field */}
        <Section
          title="Input + Field 输入框"
          desc="Field 提供 label / description / error，配 Input 使用"
          code={`<Field label="默认模型" description="支持模糊匹配">
  <Input value={inputVal} onChange={...} />
</Field>
<Field label="嵌套深度" required>
  <Input type="number" defaultValue={2} />
</Field>`}
        >
          <div className="w-full max-w-xs space-y-4">
            <Field label="默认模型" description="支持模糊匹配，如 anthropic/claude-sonnet-4">
              <Input value={inputVal} onChange={(e) => setInputVal(e.target.value)} />
            </Field>
            <Field label="嵌套委派深度" required>
              <Input type="number" defaultValue={2} />
            </Field>
          </div>
        </Section>

        {/* Select */}
        <Section
          title="Select 下拉选择"
          desc="items: { value, label }[]"
          code={`<Select
  label="思考级别"
  items={[
    { value: "off", label: "off" },
    { value: "low", label: "low" },
    { value: "high", label: "high" },
  ]}
  value={selectVal}
  onValueChange={setSelectVal}
/>`}
        >
          <div className="w-full max-w-xs">
            <Select
              label="思考级别"
              items={[
                { value: "off", label: "off（关闭）" },
                { value: "low", label: "low" },
                { value: "medium", label: "medium" },
                { value: "high", label: "high" },
              ]}
              value={selectVal}
              onValueChange={(v) => setSelectVal(String(v))}
            />
            <div className="text-xs text-kumo-subtle mt-2">当前值：{selectVal}</div>
          </div>
        </Section>

        {/* Switch */}
        <Section
          title="Switch 开关"
          desc="checked / onCheckedChange"
          code={`<Switch
  checked={switchOn}
  onCheckedChange={setSwitchOn}
  label="FleetView 常驻面板"
/>`}
        >
          <div className="flex flex-col gap-3">
            <Switch checked={switchOn} onCheckedChange={setSwitchOn} label="FleetView 常驻面板" />
            <Switch checked={false} onCheckedChange={() => {}} label="Scope 监控（关闭示例）" />
            <Switch checked disabled label="禁用态示例" />
          </div>
        </Section>

        {/* Badge */}
        <Section
          title="Badge 徽章"
          desc="语义变体：primary / success / warning / error / neutral / info"
          code={`<Badge variant="success">已覆盖</Badge>
<Badge variant="neutral">内置</Badge>
<Badge variant="warning" appearance="dot">dot 样式</Badge>`}
        >
          {badgeRow}
        </Section>

        {/* Tabs */}
        <Section
          title="Tabs 选项卡"
          desc="数据驱动：tabs: { value, label }[] · variant: segmented（默认）/ underline"
          code={`<Tabs
  variant="underline"
  tabs={[
    { value: "detail", label: "插件详情" },
    { value: "viz", label: "可视化配置" },
  ]}
  value={tab}
  onValueChange={setTab}
/>`}
        >
          <div className="w-full space-y-4">
            <Tabs
              variant="underline"
              tabs={[
                { value: "detail", label: "插件详情" },
                { value: "viz", label: "可视化配置" },
                { value: "models", label: "模型路由" },
              ]}
              value={tab}
              onValueChange={(v) => setTab(String(v))}
            />
            <div className="text-xs text-kumo-subtle">当前选中：{tab}</div>
            <Tabs
              variant="segmented"
              size="sm"
              tabs={[
                { value: "a", label: "分段 A" },
                { value: "b", label: "分段 B" },
              ]}
            />
          </div>
        </Section>

        {/* Dialog */}
        <Section
          title="Dialog 弹框"
          desc="复合组件：Root / Trigger / Dialog(内容) / Title / Description / Close（无 Dialog.Content，内容组件就是 Dialog 本身）"
          code={`<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Trigger render={(p) => <Button {...p}>打开弹框</Button>} />
  <Dialog>
    <Dialog.Title>插件配置</Dialog.Title>
    <Dialog.Description>弹框描述</Dialog.Description>
    <Dialog.Close render={(p) => <Button variant="secondary" {...p}>关闭</Button>} />
  </Dialog>
</Dialog.Root>`}
        >
          <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
            <Dialog.Trigger render={(p) => <Button {...p}>打开弹框</Button>} />
            <Dialog>
              <Dialog.Title>插件配置</Dialog.Title>
              <Dialog.Description>Dialog 是项目内所有弹框的唯一标准</Dialog.Description>
              <div className="py-2 text-xs text-kumo-subtle">弹框主体内容区域</div>
              <Dialog.Close render={(p) => <Button variant="secondary" {...p}>关闭</Button>} />
            </Dialog>
          </Dialog.Root>
        </Section>

        <footer className="pb-8 text-center text-xs text-kumo-inactive">
          pi-web UI 组件库 · 标准来源 @cloudflare/kumo v2.9.2 · 微调项见 docs/UI-COMPONENTS.md
        </footer>
      </main>
    </div>
  );
}
