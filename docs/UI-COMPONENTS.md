# pi-web UI 组件库标准（UI Component Standards）

> 本文档是 pi-web 项目 UI 开发的**唯一标准**。所有 UI 代码必须遵循本文档。
> 标准来源：[Cloudflare Kumo](https://github.com/cloudflare/kumo)（v2.9.2），我们在其之上微调形成自己的组件库。

---

## 1. 标准来源与定位

- **底层标准**：`@cloudflare/kumo` —— Cloudflare 官方 React 组件库，基于 [Base UI](https://base-ui.com/) + Tailwind CSS v4，39 个组件，ESM、tree-shakeable、无障碍（键盘导航/焦点管理/ARIA 内建）。
- **我们的微调层**：`components/ui/` —— 在 kumo 之上做默认值微调与便捷组合，形成 pi-web 自己的组件库。
- **组件预览页**：`http://127.0.0.1:37377/design`（源码 `app/design/page.tsx`），包含所有组件代码与预览。

```
┌─────────────────────────────┐
│  components/ui/             │ ← 项目内统一导入层（微调 + 组合）
├─────────────────────────────┤
│  @cloudflare/kumo           │ ← 官方标准（不修改源码）
├─────────────────────────────┤
│  Base UI + Tailwind v4      │
└─────────────────────────────┘
```

## 2. 强制规则（必须遵守）

| # | 规则 | 说明 |
|---|------|------|
| 1 | **一律从 `@/components/ui` 导入** | 禁止直接 `import ... from "@cloudflare/kumo"`（除非包装层内部） |
| 2 | **禁止新增内联 style** | 新组件禁止 `style={{...}}` 手写样式；旧代码迁移期间除外 |
| 3 | **颜色只用语义 token** | 使用 kumo token（`bg-kumo-base`、`text-kumo-subtle`、`bg-kumo-brand` 等），禁止硬编码 hex/rgba |
| 4 | **组件必须"use client"** | kumo 组件均为客户端组件，包装层必须标注 `"use client"` |
| 5 | **新组件进包装层 + 设计页** | 新抽象必须加入 `components/ui/` 并在 `/design` 页面登记 |
| 6 | **不用 Tailwind 原子类堆样式** | 复杂布局用组件组合，不靠 className 拼 CSS |
| 7 | **弹框一律用 `Dialog`** | 禁止手写 fixed 遮罩弹框 |

## 3. 主题 token（微调项）

kumo 主题通过 Tailwind v4 `@theme` 定义，我们做了以下微调（`app/globals.css`）：

| Token | 官方默认 | 我们的微调 | 说明 |
|-------|---------|-----------|------|
| `--color-kumo-brand` | `#f6821f`（Cloudflare 橙） | `light-dark(#2563eb, #60a5fa)` | 对齐 pi-web 原有 accent 蓝，亮/暗两套 |
| dark variant | 跟随系统 | 跟随 `html.dark` class | 通过 `@custom-variant dark` 桥接 pi-web 主题切换 |
| color-scheme | - | `:root` light / `html.dark` dark | 让 kumo 的 `light-dark()` 正确响应 |

其余 token（neutral 灰阶、success/error/warning 语义色、focus ring）沿用 kumo 官方默认。

**常用 token 速查**（Tailwind class 形式）：

| 用途 | class |
|------|-------|
| 品牌/主操作 | `bg-kumo-brand` `text-kumo-brand` `ring-kumo-brand` |
| 页面背景 | `bg-kumo-base` |
| 面板/卡片背景 | `bg-kumo-surface` / `bg-kumo-tint` |
| 边框 | `ring-kumo-line` `border-kumo-line` |
| 主文字 | `text-kumo-default` `text-kumo-strong` |
| 次要文字 | `text-kumo-subtle` |
| 弱化/占位 | `text-kumo-inactive` `text-kumo-placeholder` |
| 成功 | `text-kumo-success` `bg-kumo-success` |
| 错误 | `text-kumo-danger` `bg-kumo-danger` |
| 警告 | `text-kumo-warning` |
| 链接 | `text-kumo-link` `text-kumo-info` |

## 4. 组件清单与使用规范

### 已包装组件（`components/ui/`）

| 组件 | 用法 | 说明 |
|------|------|------|
| `Button` | `<Button variant="primary\|secondary\|ghost\|destructive\|outline" size="sm\|base\|lg" loading>` | 默认 size 微调为 `sm`；primary=确认、secondary=取消、destructive=危险、ghost=文字按钮 |
| `Field` | `<Field label description error required>` | 表单字段容器，配 Input/Select |
| `Input` | `<Input value onChange type="text\|number">` | 文本/数字输入 |
| `Select` | `<Select label items value onValueChange>` | 下拉选择（items: `{value,label}[]`） |
| `Switch` | `<Switch checked onCheckedChange label>` | 开关 |
| `Badge` | `<Badge variant="success\|warning\|error\|neutral\|primary" appearance="dot">` | 状态徽章 |
| `Dialog` | `<Dialog.Root><Dialog.Trigger/><Dialog><Dialog.Title/><Dialog.Description/><Dialog.Close/></Dialog></Dialog.Root>` | 模态弹框（复合组件） |
| `Tabs` | `<Tabs variant="segmented\|underline" defaultValue>` | 选项卡 |

### kumo 其他可用组件（直接按需扩展包装，见 /design）

`Autocomplete` `Banner` `Breadcrumbs` `Checkbox` `Collapsible` `Combobox` `CommandPalette` `DatePicker` `Dropdown` `Empty` `Grid` `InputGroup` `Label` `LayerCard` `Link` `Loader` `Menubar` `Meter` `Pagination` `Popover` `Radio` `SensitiveInput` `Sidebar` `Surface` `Table` `Tabs` `Text` `Toast` `Toolbar` `Tooltip`

## 5. 新旧 UI 迁移指南

1. **新功能**：全部使用 `components/ui`。
2. **改造中的组件**：将内联 style 逐步替换为 ui 组件 + kumo token class；`style={{}}` 只允许保留动态计算值（如坐标、尺寸变量）。
3. **旧 CSS 变量**（`--bg`/`--border`/`--accent` 等）继续有效（迁移期间新旧共存），但新代码不得新增对这些变量的依赖。
4. **优先级**：`html.dark` 主题切换同时驱动新旧组件（已通过 color-scheme + @custom-variant 桥接）。

## 6. 新增组件流程

1. `components/ui/<name>.tsx`：包装 kumo 组件（默认值微调 + 类型导出），文件头写 JSDoc 用法示例
2. `components/ui/index.ts`：登记导出
3. `app/design/page.tsx`：添加预览区块（代码 + 交互示例）
4. 本文档第 4 节：补充清单行

## 7. 参考

- Kumo 官方文档：https://kumo-ui.com
- Kumo 仓库：https://github.com/cloudflare/kumo
- 组件开发细节（kumo AGENTS.md）：`node_modules/@cloudflare/kumo/README.md`
