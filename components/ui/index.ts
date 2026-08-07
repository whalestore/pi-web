"use client";

/**
 * ui/index —— pi-web 自研组件库统一出口
 *
 * 标准来源：@cloudflare/kumo（Cloudflare 官方组件库，Base UI + Tailwind v4）
 * 微调项：见 docs/UI-COMPONENTS.md
 *
 * 使用规范：
 * 1. 所有新 UI 一律从 "@/components/ui" 导入，禁止直接 import "@cloudflare/kumo"
 * 2. 禁止新增内联 style 组件（迁移中的旧代码除外）
 * 3. 颜色一律使用语义 token（kumo-* 系列），禁止硬编码 hex
 * 4. 组件预览与示例见 http://127.0.0.1:37377/design
 */
export { Button } from "./button";
export type { ButtonProps } from "./button";

export { Field } from "./field";
export type { FieldProps } from "./field";

export { Input } from "./input";
export type { InputProps } from "./input";

export { Select } from "./select";
export type { SelectProps } from "./select";

export { Switch } from "./switch";
export type { SwitchProps } from "./switch";

export { Badge } from "./badge";
export type { BadgeProps } from "./badge";

export { Dialog } from "./dialog";

export { Tabs } from "./tabs";

export { Text } from "./text";
export type { TextProps } from "./text";

export { Checkbox } from "./checkbox";
export { RadioGroup } from "./radio";
export { Tooltip, TooltipProvider } from "./tooltip";
export { Popover } from "./popover";
export { DropdownMenu } from "./dropdown";
export { ToastProvider, Toast } from "./toast";
export { Table } from "./table";
export { Empty } from "./empty";
export { Loader, SkeletonLine } from "./loader";
export { Link } from "./link";
export { Banner } from "./banner";
export { Collapsible } from "./collapsible";
export { Surface } from "./surface";
export { Label } from "./label";
export { Meter } from "./meter";
export { Textarea, InputArea } from "./input";

export { Autocomplete } from "./autocomplete";
export { Combobox } from "./combobox";
export { SensitiveInput } from "./sensitive-input";
export { InputGroup } from "./input-group";
export { Breadcrumbs } from "./breadcrumbs";
export { Pagination } from "./pagination";
export { Grid } from "./grid";
export { LayerCard } from "./layer-card";
export { ClipboardText } from "./clipboard-text";
export { Toolbar } from "./toolbar";
export { Flow } from "./flow";
export { TableOfContents } from "./table-of-contents";
export { Code, CodeHighlighted } from "./code";
export { DatePicker } from "./date-picker";
export { CommandPalette } from "./command-palette";
export { SidebarProvider, Sidebar } from "./sidebar";
export { MenuBar } from "./menubar";
export { TimeseriesChart } from "./chart";
