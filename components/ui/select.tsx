"use client";

/**
 * ui/select —— 下拉选择
 *
 * @example
 * <Select
 *   label="思考级别"
 *   items={[{ value: "high", label: "high" }, ...]}
 *   value={thinking}
 *   onValueChange={setThinking}
 * />
 */
import { Select as KumoSelect } from "@cloudflare/kumo/components/select";

/** kumo 未导出 SelectProps，用 ComponentProps 提取 */
export type SelectProps = React.ComponentProps<typeof KumoSelect>;

export const Select = KumoSelect;
export default Select;
