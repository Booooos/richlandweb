const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const {
  EMPTY_STORE,
  createEmptyStore,
  ensureDefaultUsers,
  nowIso
} = require("./store-shared");

const BACKEND_ROOT = path.join(__dirname, "..");
const BRIDGE_SCRIPT = path.join(BACKEND_ROOT, "scripts", "prisma-store-bridge.js");
const DEFAULT_DATABASE_URL = "file:./dev.db";

function bridgeEnv() {
  return {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || DEFAULT_DATABASE_URL
  };
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function runBridge(command, extraArgs) {
  const maxAttempts = Number(process.env.STORE_BRIDGE_ATTEMPTS || 10);
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return execFileSync(
        process.execPath,
        [BRIDGE_SCRIPT, command, ...(extraArgs || [])],
        {
          cwd: BACKEND_ROOT,
          env: bridgeEnv(),
          encoding: "utf8"
        }
      );
    } catch (error) {
      lastError = error;
      const message = String(error && (error.code || error.message) || "");
      const canRetry = message.includes("EAGAIN") || message.includes("ENFILE") || message.includes("EMFILE");
      if (!canRetry || attempt === maxAttempts) break;
      sleepSync(120 * attempt);
    }
  }
  throw lastError;
}

function loadStore() {
  const raw = runBridge("load");
  const parsed = JSON.parse(raw || "{}");
  const store = { ...createEmptyStore(), ...parsed };
  const changed = ensureDefaultUsers(store);
  if (changed) {
    saveStore(store);
  }
  return store;
}

function saveStore(storeInput) {
  const store = { ...createEmptyStore(), ...(storeInput || {}) };
  ensureDefaultUsers(store);
  const tempPath = path.join(
    os.tmpdir(),
    `richland-store-${process.pid}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.json`
  );
  try {
    fs.writeFileSync(tempPath, JSON.stringify(store, null, 2));
    runBridge("save", [tempPath]);
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

function resetStore(nextStore) {
  if (nextStore) {
    saveStore(nextStore);
    return;
  }
  runBridge("reset");
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

function createPortalToken() {
  return crypto.randomBytes(18).toString("hex");
}

function pushTimeline(store, event) {
  store.timeline.push({
    id: createId("tl"),
    createdAt: nowIso(),
    ...event
  });
}

module.exports = {
  EMPTY_STORE,
  createEmptyStore,
  loadStore,
  saveStore,
  resetStore,
  createId,
  createPortalToken,
  nowIso,
  pushTimeline
};
