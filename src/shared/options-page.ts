const OPTIONS_PAGE_PATH = "index.html";

function getOptionsPageUrl() {
  return chrome.runtime.getURL(OPTIONS_PAGE_PATH);
}

export async function openExtensionOptionsPage() {
  if (typeof chrome.runtime.openOptionsPage === "function") {
    await chrome.runtime.openOptionsPage();
    return;
  }

  if (chrome.tabs?.create) {
    await chrome.tabs.create({ url: getOptionsPageUrl() });
    return;
  }

  throw new Error("No supported options page opening API is available.");
}

export function openOptionsPageWindow() {
  if (typeof window === "undefined" || typeof window.open !== "function") {
    throw new Error("Window-based options page fallback is unavailable.");
  }

  window.open(getOptionsPageUrl(), "_blank", "noopener");
}
