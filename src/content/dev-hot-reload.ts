import { DEV_POLL_INTERVAL, readHotUpdatePayload } from "../shared/dev";
import type { RuntimeMessage } from "../shared/messages";

let currentBuildId = "";
let reloading = false;

export function registerDevHotReload() {
  if (!import.meta.env.DEV) {
    return;
  }

  chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
    if (message.type !== "DEV_PAGE_RELOAD") {
      return;
    }

    triggerPageReload();
  });

  void initializeHotPolling();
}

async function initializeHotPolling() {
  const payload = await readHotUpdatePayload();
  currentBuildId = payload?.buildId ?? "";

  window.setInterval(() => {
    void pollForUpdate();
  }, DEV_POLL_INTERVAL);
}

async function pollForUpdate() {
  const payload = await readHotUpdatePayload();
  if (!payload?.buildId || !currentBuildId) {
    currentBuildId = payload?.buildId ?? currentBuildId;
    return;
  }

  if (payload.buildId !== currentBuildId) {
    currentBuildId = payload.buildId;
    await chrome.runtime.sendMessage({ type: "DEV_RELOAD_EXTENSION" } satisfies RuntimeMessage);
    triggerPageReload();
  }
}

function triggerPageReload() {
  if (reloading) {
    return;
  }

  reloading = true;
  window.location.reload();
}
