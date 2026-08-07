"use client";

/**
 * ui/radio —— 单选组（kumo 标准）
 *
 * @example
 * <RadioGroup name="tier" defaultValue="fast">
  <RadioGroup.Item value="fast" label="快速" />
  <RadioGroup.Item value="deep" label="深度" />
</RadioGroup>
 */
import { RadioGroup as KumoRadioGroup } from "@cloudflare/kumo/components/radio";

export const RadioGroup = KumoRadioGroup;
export default RadioGroup;
