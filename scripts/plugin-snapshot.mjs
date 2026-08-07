#!/usr/bin/env node
/**
 * 插件版本快照 —— 每次开发后运行：npm run snapshot:plugins
 *
 * 遍历 visualizations/<plugin>/manifest.json（仅已开发可视化的插件），
 * 查询官方（npm registry / GitHub releases）最新版本与变更日志，
 * 连同本地安装版本一起写入 visualizations/<plugin>/snapshot.json。
 */
import { join } from "node:path";
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
  resolveInstalledVersion,
  warn,
} from "./plugin-utils.mjs";

async function snapshotFor(manifest) {
  const { name, source, dir } = manifest;
  const prev = loadJson(join(VIS_DIR, dir, "snapshot.json"), null);
  const snapshotPath = join(VIS_DIR, dir, "snapshot.json");

  const entry = {
    plugin: name,
    source,
    installedVersion: resolveInstalledVersion(source),
    latestVersion: null,
    latestPublishedAt: null,
    releasedVersions: [],
    changelog: "（首次快照，无变更记录）",
    previousLatest: prev?.latestVersion ?? null,
    snapshotAt: new Date().toISOString(),
  };

  // ---- 查询官方最新版本 ----
  if (source.startsWith("npm:")) {
    const pkgName = npmPackageName(source);
    let registry;
    try {
      registry = await fetchNpmRegistry(pkgName);
    } catch (e) {
      warn(`查询 npm registry 失败 (${pkgName}): ${e.message}`);
      return null;
    }
    entry.latestVersion = registry["dist-tags"]?.latest ?? null;
    entry.latestPublishedAt = registry.time?.[entry.latestVersion] ?? null;
    if (registry.time) {
      const times = registry.time;
      entry.releasedVersions = Object.keys(times)
        .filter((v) => v !== "created" && v !== "modified")
        .sort(compareVersions)
        .filter((v) => compareVersions(v, entry.previousLatest ?? entry.installedVersion ?? "0.0.0") > 0);
    }
    // GitHub release notes（changelog）
    const releases = await fetchGitHubReleases(gitRepoSlug(registry.repository?.url));
    if (releases) {
      entry.changelog = buildChangelog(releases, prev?.latestVersion ?? entry.installedVersion ?? "0.0.0", entry.latestVersion ?? "0.0.0");
    }
  } else if (source.startsWith("git:") || /^https?:\/\//.test(source)) {
    const slug = gitRepoSlug(source);
    const releases = await fetchGitHubReleases(slug);
    if (Array.isArray(releases) && releases.length > 0) {
      const latest = releases.find((r) => r.tag_name && !r.prerelease) ?? releases[0];
      entry.latestVersion = String(latest.tag_name).replace(/^v/, "");
      entry.latestPublishedAt = latest.published_at ?? null;
      entry.changelog = buildChangelog(releases, prev?.latestVersion ?? entry.installedVersion ?? "0.0.0", entry.latestVersion);
    } else {
      warn(`无法从 GitHub 获取 ${slug ?? source} 的最新版本`);
      return null;
    }
  } else {
    warn(`不支持的插件来源: ${source}`);
    return null;
  }

  if (!entry.latestVersion) {
    warn(`未能确定官方最新版本，跳过 ${name}`);
    return null;
  }

  return { entry, snapshotPath };
}

const manifests = listManifests();
if (manifests.length === 0) {
  console.log("没有找到任何已开发可视化的插件（visualizations/<plugin>/manifest.json），无需快照。");
  process.exit(0);
}

for (const manifest of manifests) {
  const result = await snapshotFor(manifest);
  if (!result) continue;
  const { entry, snapshotPath } = result;
  // 写入磁盘（保留缩进便于 diff 审查）
  const { writeFileSync } = await import("node:fs");
  writeFileSync(snapshotPath, JSON.stringify(entry, null, 2) + "\n");
  const upgrade =
    entry.previousLatest && compareVersions(entry.latestVersion, entry.previousLatest) > 0
      ? `  ⬆️ 官方有升级: ${entry.previousLatest} → ${entry.latestVersion}`
      : "";
  console.log(
    `[ok] ${entry.plugin}: 安装 ${entry.installedVersion ?? "未安装"} / 官方最新 ${entry.latestVersion}${upgrade}`
  );
  console.log(`     → ${snapshotPath.replace(process.cwd() + "/", "")}`);
}

console.log("\n快照完成。若上方出现 ⬆️ 提示，可运行 npm run check:plugins-updates 创建升级 issue。");
