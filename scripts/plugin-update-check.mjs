#!/usr/bin/env node
/**
 * 插件升级检测 —— 对比快照与官方最新版本，发现升级则自动创建 GitHub issue。
 * 用法: npm run check:plugins-updates   （本地或 GitHub Actions cron 均可）
 *
 * 环境变量:
 *   PLUGIN_UPDATE_REPO   issue 推送仓库（默认 whalestore/pi-web）
 *   DRY_RUN=1            只打印将要创建/复用的 issue，不实际调用 gh
 *   GH_TOKEN             gh CLI 的令牌（Actions 中为 ${{ secrets.GITHUB_TOKEN }}）
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  VIS_DIR,
  buildChangelog,
  compareVersions,
  fetchGitHubReleases,
  fetchNpmRegistry,
  gitRepoSlug,
  listManifests,
  loadJson,
  npmPackageName,
  warn,
} from "./plugin-utils.mjs";

const REPO = process.env.PLUGIN_UPDATE_REPO ?? "whalestore/pi-web";
const DRY_RUN = process.env.DRY_RUN === "1";
const LABEL = "plugin-update";
const LABEL_COLOR = "d4c5f9";
const LABEL_DESC = "官方插件版本升级，需要处理的可视化/升级任务";

function ghAvailable() {
  try {
    execFileSync("gh", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function ensureLabel() {
  if (DRY_RUN || !ghAvailable()) return;
  try {
    execFileSync("gh", ["label", "create", LABEL, "--repo", REPO, "--force", "--color", LABEL_COLOR, "--description", LABEL_DESC], {
      stdio: "ignore",
    });
  } catch (e) {
    warn(`创建 label 失败: ${e.message}`);
  }
}

/** 幂等检查：同包同目标版本是否已有 open issue */
function hasOpenIssue(pluginName, targetVersion) {
  if (!ghAvailable()) return false;
  try {
    const search = `"${pluginName}" "${targetVersion}" in:title label:${LABEL}`;
    const out = execFileSync(
      "gh",
      ["issue", "list", "--repo", REPO, "--search", search, "--state", "open", "--json", "number", "--jq", "length"],
      { encoding: "utf8" }
    );
    return parseInt(out.trim(), 10) > 0;
  } catch (e) {
    warn(`查询已有 issue 失败: ${e.message}`);
    return true; // 查询失败时保守跳过，避免重复推送
  }
}

function buildIssueBody({ plugin, source, from, to, publishedAt, changelog, installed }) {
  return `## 插件升级任务：${plugin} ${from} → ${to}

| 项 | 值 |
| --- | --- |
| 插件 | \`${plugin}\` |
| 来源 | \`${source}\` |
| 当前快照版本 | ${from} |
| 官方最新版本 | **${to}** |
| 官方发布时间 | ${publishedAt ? publishedAt.slice(0, 10) : "未知"} |
| 本地安装版本 | ${installed ?? "未安装"} |

### 官方变更日志

${changelog}

### 升级检查清单

- [ ] 阅读上方变更日志，识别破坏性变更（配置项变更、字段改名、行为变化）
- [ ] 本地升级：\`pi install ${source}\`（如需锁定版本请保留版本号）
- [ ] 更新可视化配置 \`visualizations/${plugin}/\`，使 UI 与新版本配置项保持一致
- [ ] 运行 \`npm run snapshot:plugins\` 更新快照
- [ ] 本地验证后提交并推送，然后关闭本 issue

---
<sub>由 plugin-update-check 自动生成 · 快照对比：${from} → ${to}</sub>
`;
}

async function checkFor(manifest) {
  const { name, source, dir } = manifest;
  const snapshot = loadJson(join(VIS_DIR, dir, "snapshot.json"), null);
  if (!snapshot?.latestVersion) {
    warn(`${name} 还没有快照，请先运行 npm run snapshot:plugins`);
    return;
  }
  const from = snapshot.latestVersion;

  // 查询官方最新版本
  let latest = null;
  let publishedAt = null;
  let releases = null;
  if (source.startsWith("npm:")) {
    const pkgName = npmPackageName(source);
    let registry;
    try {
      registry = await fetchNpmRegistry(pkgName);
    } catch (e) {
      warn(`查询 npm registry 失败 (${pkgName}): ${e.message}`);
      return;
    }
    latest = registry["dist-tags"]?.latest ?? null;
    publishedAt = registry.time?.[latest] ?? null;
    releases = await fetchGitHubReleases(gitRepoSlug(registry.repository?.url));
  } else if (source.startsWith("git:") || /^https?:\/\//.test(source)) {
    releases = await fetchGitHubReleases(gitRepoSlug(source));
    if (Array.isArray(releases) && releases.length > 0) {
      const r = releases.find((x) => x.tag_name && !x.prerelease) ?? releases[0];
      latest = String(r.tag_name).replace(/^v/, "");
      publishedAt = r.published_at ?? null;
    }
  }
  if (!latest) {
    warn(`无法确定 ${name} 的官方最新版本，跳过`);
    return;
  }

  if (compareVersions(latest, from) <= 0) {
    console.log(`[ok] ${name}: 无升级（快照 ${from} = 官方最新 ${latest}）`);
    return;
  }

  console.log(`[!!] ${name}: 官方已升级 ${from} → ${latest}`);
  const changelog = releases ? buildChangelog(releases, from, latest) : "（无法获取 release notes）";
  const title = `[插件更新] ${name} ${from} → ${latest}`;

  if (hasOpenIssue(name, latest)) {
    console.log(`    已有相同升级任务的 open issue，跳过（${REPO}）`);
    return;
  }

  const body = buildIssueBody({
    plugin: name,
    source,
    from,
    to: latest,
    publishedAt,
    changelog,
    installed: snapshot.installedVersion ?? null,
  });

  if (DRY_RUN || !ghAvailable()) {
    console.log(`    [dry-run] 将创建 issue: ${title} → ${REPO}`);
    console.log("    ---- issue 正文 ----");
    console.log(body.split("\n").map((l) => "    " + l).join("\n"));
    return;
  }

  const tmpDir = mkdtempSync(join(tmpdir(), "plugin-update-"));
  const bodyFile = join(tmpDir, "issue-body.md");
  writeFileSync(bodyFile, body);
  try {
    execFileSync("gh", ["issue", "create", "--repo", REPO, "--title", title, "--body-file", bodyFile, "--label", LABEL], {
      stdio: "inherit",
    });
    console.log(`    → issue 已创建: https://github.com/${REPO}/issues`);
  } catch (e) {
    warn(`创建 issue 失败: ${e.message}`);
  }
}

// ---- main ----
const manifests = listManifests();
if (manifests.length === 0) {
  console.log("没有找到任何已开发可视化的插件（visualizations/<plugin>/manifest.json），无需检测。");
  process.exit(0);
}
if (!ghAvailable() && !DRY_RUN) {
  console.log("未检测到 gh CLI，进入 dry-run 模式（只打印，不创建 issue）。");
}
ensureLabel();
console.log(`检测仓库: ${REPO}${DRY_RUN ? "（DRY_RUN）" : ""}`);
for (const manifest of manifests) {
  await checkFor(manifest);
}
console.log("\n检测完成。");
