"use client";

/**
 * 字体指导页 —— http://127.0.0.1:37377/font
 *
 * 穷举 kumo 全部 42 个组件的字体规范（源码提取实证）。
 * 开发任何组件内部文字时，必须遵循此页面的字号/字重指导。
 * 标准文档：docs/UI-COMPONENTS.md
 */
import { useState } from "react";
import { FONT_SPECS, BASE_LEVELS } from "./data";
import { Input } from "@/components/ui";

export default function FontPage() {
  const [filter, setFilter] = useState("");

  const filtered = FONT_SPECS.filter((s) =>
    s.comp.toLowerCase().includes(filter.toLowerCase())
  );
  const totalElements = FONT_SPECS.reduce((a, s) => a + s.elements.length, 0);
  const sizeVariantCount = FONT_SPECS.reduce(
    (a, s) => a + Object.keys(s.sizes).length,
    0
  );

  return (
    <div className="h-dvh overflow-y-auto bg-kumo-base text-kumo-default">
      <header className="sticky top-0 z-10 border-b border-kumo-line bg-kumo-surface/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <h1 className="text-base font-bold shrink-0">字体指导 · Font Guide</h1>
            <span className="text-xs text-kumo-subtle truncate">
              kumo 42 个组件 · {totalElements} 条元素规范 · {sizeVariantCount} 个尺寸变体
            </span>
          </div>
          <div className="w-52 shrink-0">
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="搜索组件…"
              aria-label="搜索组件"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-5 space-y-6">
        {/* 基础层级 */}
        <div className="border border-kumo-line rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-kumo-line">
            <div className="text-base font-semibold">① 基础字号层级（Text 组件）</div>
            <div className="text-xs text-kumo-subtle mt-0.5">
              根字号 16px · 所有 tailwind 字号基于此缩放
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {BASE_LEVELS.map((l) => (
              <div key={l.name} className="border border-kumo-line rounded-lg p-3 bg-kumo-base">
                <div className={`${l.cls} truncate`}>{l.name} · {l.use}</div>
                <div className="text-xs text-kumo-inactive mt-2 font-mono">
                  {l.size} · {l.cls}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 全部组件字体规范 */}
        <div className="border border-kumo-line rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-kumo-line">
            <div className="text-base font-semibold">② 全部组件字体规范（{filtered.length}/{FONT_SPECS.length}）</div>
            <div className="text-xs text-kumo-subtle mt-0.5">
              每行 = 组件的一个内部元素 · 字号列给出该元素必须使用的字号 · 显示 {totalElements} 条规范
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-kumo-line text-left bg-kumo-tint">
                  <th className="px-4 py-2 text-xs font-semibold text-kumo-subtle w-44">组件</th>
                  <th className="px-4 py-2 text-xs font-semibold text-kumo-subtle w-40">尺寸变体</th>
                  <th className="px-4 py-2 text-xs font-semibold text-kumo-subtle">内部元素（源码 class）</th>
                  <th className="px-4 py-2 text-xs font-semibold text-kumo-subtle w-24">字号</th>
                  <th className="px-4 py-2 text-xs font-semibold text-kumo-subtle w-40">实际预览</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map((spec) => {
                  const sizeRows = Object.entries(spec.sizes);
                  const rowCount = Math.max(spec.elements.length, sizeRows.length, 1);
                  return Array.from({ length: rowCount }).map((_, i) => {
                    const isFirst = i === 0;
                    const sizeEntry = sizeRows[i];
                    const elem = spec.elements[i];
                    const sizeVal = sizeEntry ? sizeEntry[1] : elem ? elem[1] : "";
                    return (
                      <tr key={spec.comp + i} className="border-b border-kumo-line last:border-0 align-top">
                        <td className="px-4 py-2">
                          {isFirst ? (
                            <span className="font-mono text-xs font-semibold">{spec.comp}</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-2">
                          {sizeEntry ? (
                            <span className="text-xs font-mono">
                              <span className="text-kumo-inactive">{sizeEntry[0]}:</span>{" "}
                              <span className="text-kumo-default">{sizeEntry[1]}</span>
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-2">
                          {elem ? (
                            <code className="text-[11px] font-mono text-kumo-subtle break-all">{elem[0]}</code>
                          ) : null}
                        </td>
                        <td className="px-4 py-2">
                          {sizeVal ? (
                            <span className="text-xs font-mono text-kumo-default font-semibold">{sizeVal}</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-2">
                          {sizeVal ? (
                            <span style={{ fontSize: sizeVal }} className="text-kumo-default truncate block">
                              {spec.comp}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 组件级使用指导 */}
        <div className="border border-kumo-line rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-kumo-line">
            <div className="text-base font-semibold">③ 组合规范（弹框/卡片/表单页）</div>
            <div className="text-xs text-kumo-subtle mt-0.5">使用多个组件组合时的字体层级约定</div>
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-kumo-line text-left">
                  <th className="px-3 py-1.5 text-xs font-semibold text-kumo-subtle">场景</th>
                  <th className="px-3 py-1.5 text-xs font-semibold text-kumo-subtle">元素</th>
                  <th className="px-3 py-1.5 text-xs font-semibold text-kumo-subtle">字号/字重</th>
                  <th className="px-3 py-1.5 text-xs font-semibold text-kumo-subtle">颜色</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ["弹框", "Dialog.Title（需自设）", "16px text-lg / 600", "text-kumo-default"],
                  ["弹框", "Dialog.Description", "14px text-base / 400", "text-kumo-subtle"],
                  ["弹框", "分组标题 SectionLabel", "13px text-sm / 600 uppercase", "text-kumo-subtle"],
                  ["弹框", "底部操作条文字", "13px text-sm / 400", "text-kumo-subtle"],
                  ["卡片", "卡片标题", "14px text-base / 600", "text-kumo-default"],
                  ["卡片", "卡片描述", "13px text-sm / 400", "text-kumo-subtle"],
                  ["卡片", "卡片辅助行（模型/标签）", "12px text-xs / 400", "text-kumo-inactive"],
                  ["表单", "Field 标签", "14px text-base / 500", "text-kumo-default"],
                  ["表单", "Field 描述/错误", "13px text-sm / 400", "text-kumo-subtle / -danger"],
                  ["表单", "输入值", "14px text-base / 400", "text-kumo-default"],
                  ["表单", "占位符", "14px / 400", "text-kumo-placeholder"],
                  ["导航", "Tabs 标签", "14px text-base / 500", "text-kumo-default"],
                  ["导航", "分类导航按钮", "12px text-xs / 400", "text-kumo-subtle / 选中 -brand"],
                  ["表格", "单元格", "12px text-xs / 400", "text-kumo-strong"],
                  ["表格", "表头", "12px text-xs / 600", "text-kumo-strong"],
                  ["状态", "Badge 徽章", "12px text-xs / 500", "语义色"],
                  ["状态", "时间线时间", "12px text-xs / 400", "text-kumo-inactive"],
                ].map(([scene, el, size, color]) => (
                  <tr key={scene + el} className="border-b border-kumo-line last:border-0">
                    <td className="px-3 py-1.5 text-xs text-kumo-subtle">{scene}</td>
                    <td className="px-3 py-1.5 text-xs">{el}</td>
                    <td className="px-3 py-1.5 text-xs font-mono">{size}</td>
                    <td className="px-3 py-1.5 text-xs font-mono text-kumo-subtle">{color}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="pb-8 text-center text-xs text-kumo-inactive">
          Font Guide · kumo v2.9.2 源码提取 · 与 /design 组件库页配套使用
        </footer>
      </main>
    </div>
  );
}
