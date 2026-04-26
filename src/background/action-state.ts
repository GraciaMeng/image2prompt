import { SETTINGS_KEY } from "../shared/constants";
import { getSettings } from "../shared/storage";
import { getSettingsIssues } from "../shared/settings-status";

export async function syncActionState() {
  const settings = await getSettings();
  const issues = getSettingsIssues(settings);

  if (issues.length > 0) {
    await chrome.action.setBadgeBackgroundColor({ color: "#d9485f" });
    await chrome.action.setBadgeText({ text: "!" });
    await chrome.action.setTitle({
      title: `Image to Prompt\n待完成配置：${issues[0]?.message ?? "请先打开设置页"}`
    });
    return;
  }

  await chrome.action.setBadgeBackgroundColor({ color: "#1f8f64" });
  await chrome.action.setBadgeText({ text: "OK" });
  await chrome.action.setTitle({
    title: `Image to Prompt\n已就绪，可在网页图片上右键开始分析`
  });
}

export function registerActionStateSync() {
  void syncActionState();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !(SETTINGS_KEY in changes)) {
      return;
    }

    void syncActionState();
  });
}
