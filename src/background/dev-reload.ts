import { DEV_POLL_INTERVAL, readHotUpdatePayload } from "../shared/dev";
import type { RuntimeMessage } from "../shared/messages";

let currentBuildId = "";
let devReloading = false;

export function registerDevReloadHandler() {
  if (!import.meta.env.DEV) {
    return;
  }

  void primeBuildId();

  chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
    if (message.type !== "DEV_RELOAD_EXTENSION") {
      return false;
    }

    void reloadExtension();
    return false;
  });

  chrome.alarms.create("image2prompt-dev-poll", {
    periodInMinutes: Math.max(0.02, DEV_POLL_INTERVAL / 60000)
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== "image2prompt-dev-poll") {
      return;
    }

    void checkForExtensionUpdate();
  });
}

async function primeBuildId() {
  const payload = await readHotUpdatePayload();
  currentBuildId = payload?.buildId ?? "";
}

async function checkForExtensionUpdate() {
  const payload = await readHotUpdatePayload();
  if (!payload?.buildId || !currentBuildId) {
    currentBuildId = payload?.buildId ?? currentBuildId;
    return;
  }

  if (payload.buildId !== currentBuildId) {
    await reloadExtension();
  }
}

async function reloadExtension() {
  if (devReloading) {
    return;
  }

  devReloading = true;
  const tabs = await chrome.tabs.query({});

  await Promise.all(
    tabs
      .filter((tab) => typeof tab.id === "number" && Boolean(tab.url?.startsWith("http")))
      .map((tab) =>
        chrome.tabs.sendMessage(tab.id!, { type: "DEV_PAGE_RELOAD" } satisfies RuntimeMessage).catch(() => undefined)
      )
  );

  chrome.runtime.reload();
}
