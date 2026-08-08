import { NextResponse } from "next/server";
import {
  readSubagentsVizData,
  saveSubagentsVizData,
  type SubagentsVizData,
} from "@/lib/plugin-viz";

export const dynamic = "force-dynamic";

/** GET /api/plugin-viz/subagents —— 读取 pi-subagents 可视化配置 */
export async function GET() {
  try {
    return NextResponse.json(readSubagentsVizData());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

/** PUT /api/plugin-viz/subagents —— 保存可视化配置（部分更新） */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<SubagentsVizData>;
    if (
      body.configJson !== undefined &&
      (typeof body.configJson !== "object" || body.configJson === null)
    ) {
      return NextResponse.json({ error: "configJson 必须是对象" }, { status: 400 });
    }
    if (
      body.settingsSubagents !== undefined &&
      (typeof body.settingsSubagents !== "object" || body.settingsSubagents === null)
    ) {
      return NextResponse.json({ error: "settingsSubagents 必须是对象" }, { status: 400 });
    }
    const data = saveSubagentsVizData(body);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
