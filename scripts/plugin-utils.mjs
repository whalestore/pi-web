/**
 * pi-web 插件可视化快照与升级检测 —— 共享工具库
 * 只处理 visualizations/<plugin>/manifest.json 中声明的插件（即已开发可视化的插件）。
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const VIS_DIR = join(ROOT, "visualizations");
export const HOME = process.env.HOME ?? process.env.USERPROFILE ?? "";
export const SETTINGS_PATH =
  process.env.PI_SETTINGS_PATH ?? join(HOME, ".pi", "agent", "settings.json");
export const NPM_MODULES = join(HOME, ".pi", "agent", "npm", "node_modules");
export const GIT_PKGS = join(HOME, ".pi", "agent", "git");
export const REGISTRY = process.env.NPM_REGISTRY ?? "https://registry.npmjs.org";
export const MAX_CHANGELOG_CHARS = 6000;

export function warn(msg) {
  console.warn(`[warn] ${msg}`);
}

export function loadJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return fallback;
    throw e;
  }
}

/** 遍历 visualizations/<plugin>/manifest.json */
export function listManifests() {
  if (!existsSync(VIS_DIR)) {
    warn(`可视化目录不存在: ${VIS_DIR}`);
    return [];
  }
  const out = [];
  for (const dir of readdirSync(VIS_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const manifestPath = join(VIS_DIR, dir.name, "manifest.json");
    if (!existsSync(manifestPath)) continue;
    const manifest = loadJson(manifestPath);
    if (!manifest?.name) {
      warn(`${manifestPath} 缺少 name 字段，跳过`);
      continue;
    }
    out.push({ ...manifest, dir: dir.name, manifestPath });
  }
  return out;
}

/** npm:pi-subagents / npm:@scope/pkg@1.2.3 → 包名 */
export function npmPackageName(source) {
  const rest = source.replace(/^npm:/, "");
  const m = rest.match(/^(@[^/]+\/)?([^@]+?)(?:@.*)?$/);
  return m ? `${m[1] ?? ""}${m[2]}` : rest;
}

/**
 * git 源 → GitHub slug (owner/repo)
 * 支持 git:github.com/owner/repo@ref、git:git@github.com:owner/repo、https://github.com/owner/repo、以及 npm registry 的 repository.url
 */
export function gitRepoSlug(source) {
  if (!source) return null;
  let rest = String(source).replace(/^git\+/, "").replace(/^git:/, "").replace(/\.git$/, "");
  // 去掉尾部 ref（如 @v1、@main）
  rest = rest.replace(/@[^/:]+$/, "");
  const m = rest.match(/github\.com(?::|\/)([^/]+)\/([^/.]+)/);
  return m ? `${m[1]}/${m[2]}` : null;
}

/** 简单 semver 比较（忽略 pre-release / 构建元数据），返回 -1 | 0 | 1 */
export function compareVersions(a, b) {
  const pa = String(a ?? "").match(/^v?(\d+)\.(\d+)\.(\d+)/);
  const pb = String(b ?? "").match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!pa || !pb) return String(a).localeCompare(String(b));
  for (let i = 1; i <= 3; i++) {
    const d = Number(pa[i]) - Number(pb[i]);
    if (d !== 0) return d;
  }
  return 0;
}

/** 读取 ~/.pi/agent/settings.json（不存在返回空结构） */
export function readSettings() {
  return loadJson(SETTINGS_PATH, { packages: [] });
}

/** 根据 source 解析本地安装版本（~/.pi/agent/npm 或 ~/.pi/agent/git），未安装返回 null */
export function resolveInstalledVersion(source) {
  try {
    let pkgPath = null;
    if (source.startsWith("npm:")) {
      pkgPath = join(NPM_MODULES, npmPackageName(source), "package.json");
    } else if (source.startsWith("git:") || /^https?:\/\//.test(source)) {
      const slug = gitRepoSlug(source);
      if (slug) pkgPath = join(GIT_PKGS, slug, "package.json");
    }
    if (!pkgPath || !existsSync(pkgPath)) return null;
    return loadJson(pkgPath)?.version ?? null;
  } catch (e) {
    warn(`读取安装版本失败 (${source}): ${e.message}`);
    return null;
  }
}

/** 查询 npm registry 元数据 */
export async function fetchNpmRegistry(name) {
  const url = `${REGISTRY}/${encodeURIComponent(name).replace(/%2F/g, "/")}`;
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "pi-web-plugin-update-check" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`npm registry ${res.status} for ${name}`);
  return res.json();
}

/** 查询 GitHub releases（失败返回 null，不抛错） */
export async function fetchGitHubReleases(slug) {
  if (!slug) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${slug}/releases?per_page=30`, {
      headers: { accept: "application/json", "user-agent": "pi-web-plugin-update-check" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** 从 GitHub releases 中提取 (from, to] 区间版本的变更日志文本 */
export function buildChangelog(releases, from, to) {
  if (!Array.isArray(releases) || releases.length === 0) {
    return "（无法获取 GitHub Release notes，请访问官方仓库查看变更）";
  }
  const inRange = releases
    .filter((r) => {
      const tag = String(r.tag_name ?? "").replace(/^v/, "");
      return compareVersions(tag, from) > 0 && compareVersions(tag, to) <= 0;
    })
    .sort((a, b) => compareVersions(a.tag_name, b.tag_name));
  if (inRange.length === 0) return "（该版本区间无 GitHub Release notes）";
  const parts = inRange.map((r) => {
    const body = String(r.body ?? "").trim() || "（无详细说明）";
    const title = r.name ? ` — ${r.name}` : "";
    const date = r.published_at ? r.published_at.slice(0, 10) : "未知日期";
    return `### ${r.tag_name}${title} (${date})\n\n${body}`;
  });
  let text = parts.join("\n\n---\n\n");
  if (text.length > MAX_CHANGELOG_CHARS) {
    text = text.slice(0, MAX_CHANGELOG_CHARS) + "\n…（已截断）";
  }
  return text;
}
