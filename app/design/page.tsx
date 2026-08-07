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
import {
  Button, Field, Input, Select, Switch, Badge, Dialog, Tabs, Text,
  Checkbox, RadioGroup, Textarea, Label, Meter, Combobox, Autocomplete, SensitiveInput, InputGroup,
  Banner, Tooltip, TooltipProvider, Loader, Empty, Popover, DropdownMenu,
  Breadcrumbs, Pagination, Collapsible, Link, Toolbar, TableOfContents,
  Table, Surface, LayerCard, Grid, ClipboardText, Code,
} from "@/components/ui";
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
        <div className="text-base font-semibold text-kumo-default">{title}</div>
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
            <div className="text-base font-semibold">语义色板（kumo tokens）</div>
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

        {/* 字体标准 */}
        <div className="border border-kumo-line rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-kumo-line">
            <div className="text-base font-semibold">Typography 字体标准（kumo Text 组件）</div>
            <div className="text-xs text-kumo-subtle mt-0.5">所有页面标题/正文必须遵循此层级，禁止自选字号</div>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 层级预览 */}
            <div className="space-y-4">
              <div>
                <Text variant="heading1" as="h1">heading1 · 页面主标题</Text>
                <div className="text-xs text-kumo-inactive mt-0.5">text-3xl (30px) font-semibold</div>
              </div>
              <div>
                <Text variant="heading2" as="h2">heading2 · 区块标题</Text>
                <div className="text-xs text-kumo-inactive mt-0.5">text-2xl (24px) font-semibold</div>
              </div>
              <div>
                <Text variant="heading3" as="h3">heading3 · 小节标题</Text>
                <div className="text-xs text-kumo-inactive mt-0.5">text-lg (16px) font-semibold</div>
              </div>
              <div>
                <Text variant="body">body · 正文内容</Text>
                <div className="text-xs text-kumo-inactive mt-0.5">text-base (14px) · text-kumo-default</div>
              </div>
              <div>
                <Text variant="secondary">secondary · 次要说明</Text>
                <div className="text-xs text-kumo-inactive mt-0.5">text-kumo-subtle 次要色</div>
              </div>
              <div>
                <Text variant="mono" size="lg">mono · 代码/路径 deepseek-v4-pro</Text>
                <div className="text-xs text-kumo-inactive mt-0.5">font-mono · 等宽字体</div>
              </div>
            </div>
            {/* 字号表 */}
            <div className="border border-kumo-line rounded-lg overflow-hidden self-start w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-kumo-line text-left">
                    <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">名称</th>
                    <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">字号</th>
                    <th className="px-4 py-2 text-xs font-medium text-kumo-inactive">用途</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    ["heading1", "30px (text-3xl)", "页面主标题"],
                    ["heading2", "24px (text-2xl)", "区块标题"],
                    ["heading3", "16px (text-lg)", "小节标题（semibold）"],
                    ["body", "14px (text-base)", "正文（默认）"],
                    ["size=sm", "13px (text-sm)", "紧凑正文/表格"],
                    ["size=xs", "12px (text-xs)", "辅助/标注/徽章"],
                  ].map(([name, px, use]) => (
                    <tr key={name} className="border-b border-kumo-line last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{name}</td>
                      <td className="px-4 py-2 text-xs text-kumo-subtle">{px}</td>
                      <td className="px-4 py-2 text-xs text-kumo-subtle">{use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* 组件内部字体规范 */}
          <div className="border-t border-kumo-line">
            <div className="px-4 py-2.5 border-b border-kumo-line text-xs font-semibold text-kumo-subtle">
              组件内部字体规范（kumo 源码实证）· 开发组件时内部文字必须遵循下表
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-kumo-line text-left">
                    <th className="px-3 py-1.5 text-xs font-medium text-kumo-inactive">组件</th>
                    <th className="px-3 py-1.5 text-xs font-medium text-kumo-inactive">内部元素</th>
                    <th className="px-3 py-1.5 text-xs font-medium text-kumo-inactive">字号</th>
                    <th className="px-3 py-1.5 text-xs font-medium text-kumo-inactive">字重</th>
                    <th className="px-3 py-1.5 text-xs font-medium text-kumo-inactive">颜色</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    ["Button", "按钮文字 (xs/sm)", "12px text-xs", "500", "text-kumo-default"],
                    ["Button", "按钮文字 (base/lg)", "14px text-base", "500", "text-kumo-default"],
                    ["Input / Select", "输入文本", "14px text-base", "400", "text-kumo-default"],
                    ["Input / Select", "描述 / 错误", "13px text-sm", "400", "text-kumo-subtle / -danger"],
                    ["Switch", "开关标签", "14px text-base", "500", "text-kumo-default"],
                    ["Switch", "开关描述", "13px text-sm", "400", "text-kumo-subtle"],
                    ["Badge", "徽章文字", "12px text-xs", "500", "语义色"],
                    ["Tabs", "标签文字", "14px text-base", "500", "text-kumo-default"],
                    ["Table", "单元格", "12px text-xs", "400", "text-kumo-strong"],
                    ["Table", "表头", "12px text-xs", "600", "text-kumo-strong"],
                    ["Field", "字段标签", "14px text-base", "500", "text-kumo-default"],
                    ["Field", "描述 / 错误", "13px text-sm", "400", "text-kumo-subtle / -danger"],
                    ["Dialog", "弹框标题（需自设）", "16px text-lg", "600", "text-kumo-default"],
                    ["Dialog", "弹框描述", "14px text-base", "400", "text-kumo-subtle"],
                    ["Empty", "空状态标题", "24px text-2xl", "600", "text-kumo-default"],
                    ["Empty", "空状态描述", "13px text-sm", "400", "text-kumo-subtle"],
                    ["Banner", "横幅文字", "13px text-sm", "400", "语义色"],
                    ["Breadcrumbs", "面包屑", "13px text-sm (sm) / 14px (base)", "500", "text-kumo-subtle"],
                    ["Pagination", "分页文字", "13px text-sm", "400", "text-kumo-subtle"],
                    ["Meter", "度量值", "13px text-sm", "500", "text-kumo-default"],
                    ["Meter", "度量标签", "12px text-xs", "400", "text-kumo-subtle"],
                    ["卡片（组合）", "卡片标题", "14px text-base", "600", "text-kumo-default"],
                    ["卡片（组合）", "卡片描述", "13px text-sm", "400", "text-kumo-subtle"],
                    ["卡片（组合）", "卡片辅助行", "12px text-xs", "400", "text-kumo-inactive"],
                    ["页面", "页面标题", "30px text-3xl", "600", "text-kumo-strong"],
                    ["页面", "区块标题", "24px text-2xl", "600", "text-kumo-default"],
                    ["页面", "小节标题", "16px text-lg", "600", "text-kumo-default"],
                  ].map(([comp, el, size, weight, color]) => (
                    <tr key={comp + el} className="border-b border-kumo-line last:border-0">
                      <td className="px-3 py-1.5 font-mono text-xs">{comp}</td>
                      <td className="px-3 py-1.5 text-xs text-kumo-subtle">{el}</td>
                      <td className="px-3 py-1.5 text-xs font-mono text-kumo-default">{size}</td>
                      <td className="px-3 py-1.5 text-xs text-kumo-subtle">{weight}</td>
                      <td className="px-3 py-1.5 text-xs font-mono text-kumo-subtle">{color}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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


        {/* ═══════ 表单组件补充 ═══════ */}
        <Section
          title="表单组件（Checkbox / Radio / Textarea / Label / Meter）"
          desc="复选框、单选、多行输入、标签、度量条"
          code={`<Checkbox label="启用" checked={on} onCheckedChange={setOn} />
<RadioGroup name="tier" defaultValue="fast">
  <RadioGroup.Item value="fast" label="快速" />
  <RadioGroup.Item value="deep" label="深度" />
</RadioGroup>
<Textarea placeholder="多行内容" />
<Label>字段标签</Label>
<Meter value={68} max={100} label="使用率" />`}
        >
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <Checkbox label="启用 FleetView" />
            <RadioGroup name="demo-tier" defaultValue="fast">
              <RadioGroup.Item value="fast" label="快速（flash）" />
              <RadioGroup.Item value="deep" label="深度（pro）" />
            </RadioGroup>
            <Textarea placeholder="多行输入内容" defaultValue="workflowScript 代码…" />
            <div className="flex items-center gap-3">
              <Label>使用率</Label>
              <Meter value={68} max={100} label="使用率" />
            </div>
          </div>
        </Section>

        <Section
          title="组合输入（Combobox / Autocomplete / SensitiveInput / InputGroup）"
          desc="搜索选择、自动补全、敏感输入、前后缀组"
          code={`<Combobox items={[{value:"a",label:"选项A"}]} label="组合框" />
<Autocomplete items={[{value:"deepseek-v4-pro",label:"deepseek-v4-pro"}]} />
<SensitiveInput value={secret} onChange={...} label="API Key" />
<InputGroup leading={<span>https://</span>}><Input /></InputGroup>`}
        >
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <Combobox
              items={[{ value: "a", label: "deepseek-v4-pro" }, { value: "b", label: "claude-sonnet-4" }]}
              label="模型选择"
            />
            <Autocomplete
              items={[{ value: "1", label: "deepseek-v4-pro" }, { value: "2", label: "deepseek-v4-flash" }]}
              label="自动补全"
            />
            <SensitiveInput label="API Key" defaultValue="sk-xxxx" />
            <InputGroup>
              <InputGroup.Addon className="text-sm text-kumo-subtle px-2">https://</InputGroup.Addon>
              <InputGroup.Input placeholder="域名" />
            </InputGroup>
          </div>
        </Section>

        {/* ═══════ 反馈组件 ═══════ */}
        <Section
          title="反馈组件（Banner / Tooltip / Loader / Empty / Popover / DropdownMenu）"
          desc="提示横幅、悬停提示、加载、空状态、浮层、下拉菜单"
          code={`<Banner variant="info" title="提示" description="横幅内容" />
<TooltipProvider>
  <Tooltip title="提示内容"><Button variant="secondary">悬停</Button></Tooltip>
</TooltipProvider>
<Loader size="sm" />
<Empty title="暂无数据" description="添加后显示" />
<Popover.Root><Popover.Trigger render={(p)=><Button {...p}/>} /><Popover.Content>…</Popover.Content></Popover.Root>
<DropdownMenu.Root><DropdownMenu.Trigger render={(p)=><Button {...p}/>} /><DropdownMenu.Content><DropdownMenu.Item>选项</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root>`}
        >
          <div className="flex flex-col gap-3 w-full">
            <Banner variant="default" title="提示" description="这是 Banner 提示横幅" />
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip content="悬停提示内容" render={<Button variant="secondary">悬停我</Button>} />
              </TooltipProvider>
              <Loader size="sm" />
              <Popover>
                <Popover.Trigger render={(p) => <Button variant="secondary" {...p}>浮层</Button>} />
                <Popover.Content>浮层内容</Popover.Content>
              </Popover>
              <DropdownMenu>
                <DropdownMenu.Trigger render={(p) => <Button variant="secondary" {...p}>菜单</Button>} />
                <DropdownMenu.Content>
                  <DropdownMenu.Item>选项一</DropdownMenu.Item>
                  <DropdownMenu.Item>选项二</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            </div>
            <Empty title="暂无数据" description="添加内容后显示在这里" />
          </div>
        </Section>

        {/* ═══════ 导航组件 ═══════ */}
        <Section
          title="导航组件（Breadcrumbs / Pagination / Collapsible / Link / Toolbar / TableOfContents）"
          desc="面包屑、分页、折叠、链接、工具栏、目录"
          code={`<Breadcrumbs items={[{label:"首页",href:"/"},{label:"组件"}]} />
<Pagination page={1} pageCount={10} onPageChange={...} />
<Collapsible label="高级选项">折叠内容</Collapsible>
<Link href="/design">组件库</Link>
<Toolbar><Button variant="ghost">工具A</Button></Toolbar>`}
        >
          <div className="flex flex-col gap-4 w-full">
            <Breadcrumbs>
              <Breadcrumbs.Link href="/">首页</Breadcrumbs.Link>
              <Breadcrumbs.Separator />
              <Breadcrumbs.Link href="/design">组件库</Breadcrumbs.Link>
              <Breadcrumbs.Separator />
              <Breadcrumbs.Current>当前页</Breadcrumbs.Current>
            </Breadcrumbs>
            <Pagination page={1} setPage={() => {}} perPage={10} totalCount={50}>
              <Pagination.Info />
              <Pagination.Separator />
              <Pagination.Controls />
            </Pagination>
            <Collapsible.Root>
              <Collapsible.DefaultTrigger>▸ 高级选项（点击展开）</Collapsible.DefaultTrigger>
              <Collapsible.DefaultPanel>
                <div className="text-sm text-kumo-subtle p-2">折叠面板内容</div>
              </Collapsible.DefaultPanel>
            </Collapsible.Root>
            <div className="flex items-center gap-3">
              <Link href="/design">链接 → 组件库</Link>
              <Toolbar>
                <Button variant="ghost" size="sm">工具 A</Button>
                <Button variant="ghost" size="sm">工具 B</Button>
              </Toolbar>
            </div>
          </div>
        </Section>

        {/* ═══════ 数据展示 ═══════ */}
        <Section
          title="数据展示（Table / Surface / LayerCard / Grid / ClipboardText / Code）"
          desc="表格、面板、分层卡片、栅格、复制、代码块"
          code={`<Table><Table.Header><Table.Row><Table.Head>列</Table.Head></Table.Row></Table.Header>
<Table.Body><Table.Row><Table.Cell>值</Table.Cell></Table.Row></Table.Body></Table>
<Surface variant="elevated" className="p-4">面板</Surface>
<LayerCard className="p-4">卡片</LayerCard>
<ClipboardText text="复制我" />
<Code code="const a = 1" language="ts" />`}
        >
          <div className="flex flex-col gap-3 w-full">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>角色</Table.Head>
                  <Table.Head>模型</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row><Table.Cell>reviewer</Table.Cell><Table.Cell>deepseek-v4-pro</Table.Cell></Table.Row>
                <Table.Row><Table.Cell>scout</Table.Cell><Table.Cell>deepseek-v4-flash</Table.Cell></Table.Row>
              </Table.Body>
            </Table>
            <div className="flex gap-3">
              <Surface color="secondary" className="p-3 text-sm">Surface 面板</Surface>
              <LayerCard className="p-3 text-sm">LayerCard 卡片</LayerCard>
              <ClipboardText text="要复制的文本" />
            </div>
            <Code code={`// workflowScript 示例
const scan = await runs.run("scan", { agent: "scout", task: "扫描" });
return scan.output;`} />
          </div>
        </Section>

        {/* ═══════ 复合组件 ═══════ */}
        <div className="border border-kumo-line rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-kumo-line">
            <div className="text-base font-semibold">复合/重型组件</div>
            <div className="text-xs text-kumo-subtle mt-0.5">按需使用，均可在 components/ui 中找到包装</div>
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-kumo-line text-left">
                  <th className="px-3 py-2 text-xs font-medium text-kumo-inactive">组件</th>
                  <th className="px-3 py-2 text-xs font-medium text-kumo-inactive">用途</th>
                  <th className="px-3 py-2 text-xs font-medium text-kumo-inactive">注意</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ["CommandPalette", "命令面板（Cmd+K 全局搜索/命令）", "复合组件（14 个子组件）"],
                  ["Sidebar / SidebarProvider", "应用级侧边栏（菜单/折叠/悬浮）", "复合组件"],
                  ["MenuBar", "顶部菜单栏", "useMenuNavigation"],
                  ["DatePicker", "日期选择器", "DateRangePicker 已弃用，用 mode=\x27range\x27"],
                  ["TimeseriesChart", "时序图表", "需要安装 echarts"],
                  ["Flow", "流程图/节点图", "高级可视化"],
                  ["TableOfContents", "文档目录", "useTableOfContentsActiveId"],
                  ["SkeletonLine", "骨架屏", "配合 Loader"],
                  ["Toasty / ToastManager", "命令式 toast", "createKumoToastManager"],
                  ["RefreshButton", "刷新按钮（带旋转动画）", "Button 变体"],
                ].map(([name, use, note]) => (
                  <tr key={name} className="border-b border-kumo-line last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{name}</td>
                    <td className="px-3 py-2 text-xs text-kumo-subtle">{use}</td>
                    <td className="px-3 py-2 text-xs text-kumo-inactive">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="pb-8 text-center text-xs text-kumo-inactive">
          pi-web UI 组件库 · 标准来源 @cloudflare/kumo v2.9.2 · 微调项见 docs/UI-COMPONENTS.md
        </footer>
      </main>
    </div>
  );
}
