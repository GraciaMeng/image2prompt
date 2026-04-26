export async function openOptionsPageFromContent() {
  try {
    await chrome.runtime.sendMessage({
      type: "OPEN_OPTIONS_PAGE"
    });
  } catch (error) {
    console.error("Failed to request options page opening", error);
    openOptionsPageWindowFallback();
  }
}

function openOptionsPageWindowFallback() {
  if (typeof window === "undefined" || typeof window.open !== "function") {
    throw new Error("Window-based options page fallback is unavailable.");
  }

  window.open(chrome.runtime.getURL("index.html"), "_blank", "noopener");
}
