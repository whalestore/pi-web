#!/usr/bin/env node
"use strict";

// 一键重启 pi-web dev server（dev + tray）。
// 扩展/服务端模块（lib/、pi 扩展）不在 Next dev 的 HMR 范围内，改代码必须
// 重启进程才会生效。请始终用 `npm run dev:tray` 重启，不要手动 pkill——
// 宽泛的 pkill -f 模式（如 "next-server"）会误杀其他项目进程（曾误杀 9router）。

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync, spawn } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require("http");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");

const ROOT = path.join(__dirname, "..");
const PORT = 37377;
const LOG = "/tmp/pi-web-fork.log";

// 1) 停掉旧进程：按端口杀（覆盖启动器 + next dev 子进程，孤儿进程也能杀干净）
try {
  execSync(`lsof -ti tcp:${PORT} | xargs kill`, { stdio: "ignore" });
  console.log("已停止 37377 端口上的旧进程");
} catch {
  console.log("没有进程占用 37377");
}
// 双保险：启动器（bin/pi-web.js）若没监听端口也一并停掉（[b] 防自匹配）
try {
  execSync(`pkill -f '[b]in/pi-web.js'`, { stdio: "ignore" });
} catch {}

// 2) 等待端口释放（最多 8s）
const deadline = Date.now() + 8000;
function portFree(cb) {
  const req = http.get({ host: "127.0.0.1", port: PORT, timeout: 500 }, () => {
    req.destroy();
    if (Date.now() > deadline) return cb(true); // 端口仍被占用但超时，继续尝试
    setTimeout(() => portFree(cb), 300);
  });
  req.on("error", () => cb(true)); // 连接失败 = 端口已释放
  req.on("timeout", () => {
    req.destroy();
    setTimeout(() => portFree(cb), 300);
  });
}

portFree((free) => {
  if (!free) console.warn(`警告：${PORT} 端口 8 秒内未释放，继续启动（可能 EADDRINUSE）`);
  // 3) 启动新的 dev server（detached 后台运行，输出追加到日志文件）
  const out = fs.openSync(LOG, "a");
  const child = spawn(
    process.execPath,
    ["bin/pi-web.js", "--dev", "--tray", "--no-open"],
    {
      cwd: ROOT,
      stdio: ["ignore", out, out],
      detached: true,
    },
  );
  child.unref();
  console.log(`pi-web 已重启 → http://127.0.0.1:${PORT} (日志: ${LOG})`);
  console.log("确认：curl -s http://127.0.0.1:37377/ 应返回 200");
});
