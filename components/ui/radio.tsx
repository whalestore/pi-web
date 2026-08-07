"use client";

/**
 * ui/radio —— 单选组（kumo 标准）
 *
 * @example
 * <RadioGroup name="tier" defaultValue="fast">
 *   <RadioGroup.Item value="fast" label="快速" />
 *   <RadioGroup.Item value="deep" label="深度" />
 * </RadioGroup>
 */
import {
  RadioGroup as KumoRadioGroup,
  type RadioItemProps,
} from "@cloudflare/kumo/components/radio";

/** kumo d.ts 未声明静态子组件类型，这里补全 */
export const RadioGroup = KumoRadioGroup as typeof KumoRadioGroup & {
  Item: React.ComponentType<RadioItemProps>;
  Group: React.ComponentType<{ children: React.ReactNode }>;
  Legend: React.ComponentType<{ children: React.ReactNode }>;
};
export default RadioGroup;
