#!/usr/bin/env node
"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getUnsupportedNodeVersionMessage, isNodeVersionSupported } = require("./node-version");

if (!isNodeVersionSupported(process.versions.node)) {
  console.error(getUnsupportedNodeVersionMessage(process.versions.node));
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parseLaunchOptions } = require("./pi-web-options");

const pkgDir = path.join(__dirname, "..");
const nextDir = path.join(pkgDir, ".next");

// Resolve next's CLI entry directly to avoid relying on .bin symlinks (which
// may not exist when installed via npx).
let nextBin;
try {
  nextBin = require.resolve("next/dist/bin/next", { paths: [pkgDir] });
} catch {
  // Fallback: locate next package root and derive the bin path manually.
  try {
    const nextPkg = require.resolve("next/package.json", { paths: [pkgDir] });
    nextBin = path.join(path.dirname(nextPkg), "dist", "bin", "next");
  } catch {
    nextBin = path.join(pkgDir, "node_modules", "next", "dist", "bin", "next");
  }
}

const { port, hostname, openBrowser: shouldOpenBrowser, tray, dev } = parseLaunchOptions();
const loopbackHostnames = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const passwordEnabled = Boolean(process.env.PI_WEB_PASSWORD);

if (!dev && !fs.existsSync(nextDir)) {
  console.error("Build artifacts not found. Please report this issue.");
  process.exit(1);
}

if (!loopbackHostnames.has(hostname)) {
  if (passwordEnabled) {
    console.warn(
      `Warning: pi-web is listening on ${hostname} with Basic Auth over HTTP. Use HTTPS or a trusted VPN to protect the password in transit.`,
    );
  } else {
    console.warn(
      `Warning: pi-web is listening on ${hostname} without authentication. Only use this on a trusted network.`,
    );
  }
}

const nextArgs = dev
  ? ["dev", "-H", hostname, "-p", port]
  : ["start", "-p", port, "-H", hostname];

// Always run next's JS entry with node directly — avoids .bin symlink issues
// and path-with-spaces problems on Windows when shell: true is used.
const child = spawn(process.execPath, [nextBin, ...nextArgs], {
  cwd: pkgDir,
  stdio: ["inherit", "pipe", "inherit"],
  env: { ...process.env, PI_WEB_HOSTNAME: hostname },
});

let quitting = false;
let browserOpened = false;
const url = `http://${hostname}:${port}`;

function openBrowser(url) {
  const isWindows = process.platform === "win32";
  const isMac = process.platform === "darwin";
  const openCmd = isWindows ? "start" : isMac ? "open" : "xdg-open";
  const opener = spawn(openCmd, [url], {
    shell: isWindows,
    stdio: "ignore",
    detached: true,
  });

  opener.on("error", (error) => {
    console.warn(`Could not open browser automatically: ${error.message}`);
  });

  opener.unref();
}

child.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);
  if (shouldOpenBrowser && !browserOpened && text.includes("Ready")) {
    browserOpened = true;
    openBrowser(url);
  }
});

child.on("exit", (code) => {
  if (!quitting) {
    quitTray();
  }
  process.exit(code ?? 0);
});

// ---- System tray (--tray) ----
let trayStarted = false;

function startTray() {
  if (!tray || trayStarted) return;
  try {
    // Lazy-install the systray runtime binary on macOS/Linux (no-op on
    // Windows / when already installed). Failures only disable the tray.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ensureTrayRuntime } = require("./tray/trayRuntime");
    ensureTrayRuntime({ silent: false });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initTray } = require("./tray/tray");
    initTray({
      port,
      hostname,
      onQuit: () => {
        quitting = true;
        console.log("Quit requested from tray menu");
        child.kill("SIGTERM");
      },
      onOpenDashboard: () => openBrowser(url),
    });
    trayStarted = true;
  } catch (err) {
    console.warn(`[pi-web] tray disabled: ${err.message}`);
    trayStarted = false;
  }
}

function quitTray() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { killTray } = require("./tray/tray");
    killTray();
  } catch {}
}

if (tray) {
  startTray();
}
