import { MENU_ID } from "../shared/constants";
import type { StartAnalyzeMessage } from "../shared/messages";
import type { ImageAnchor } from "../shared/types";

export function registerContextMenu() {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "分析图片并提取 Prompt",
      contexts: ["image"]
    });
  });
}

export function registerContextMenuHandler() {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== MENU_ID || !tab?.id || !info.srcUrl) {
      return;
    }

    try {
      const [anchor] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [info.srcUrl],
        func: locateImageAnchorInPage
      });

      const message: StartAnalyzeMessage = {
        type: "START_ANALYZE",
        imageUrl: info.srcUrl,
        anchor: (anchor?.result as ImageAnchor | null) ?? null
      };

      await chrome.tabs.sendMessage(tab.id, message);
    } catch (error) {
      console.error("Failed to start image analysis from context menu", error);
    }
  });
}

function locateImageAnchorInPage(imageUrl: string): ImageAnchor | null {
  const matchesImageUrl = (image: HTMLImageElement | null) => {
    if (!image) {
      return false;
    }

    return image.currentSrc === imageUrl || image.src === imageUrl;
  };

  const images = Array.from(document.images);
  const target =
    images.find((img) => matchesImageUrl(img)) ??
    null;

  if (!target) {
    return null;
  }

  const rect = target.getBoundingClientRect();
  return {
    top: window.scrollY + rect.top,
    left: window.scrollX + rect.left,
    width: rect.width,
    height: rect.height
  };
}
