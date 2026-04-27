import type { ContentMessage, StartAnalyzeMessage } from "../shared/messages";
import { getImageAnchor, getImageSource } from "../shared/image";
import type { AnalyzeImagePayload, ImageAnchor } from "../shared/types";
import {
  createFallbackAnchorResolver,
  createImageAnchorResolver,
  PromptOverlay
} from "./prompt-overlay";
import { openOptionsPageFromContent } from "./extension-actions";
import { resolveImageTarget } from "./image-target-tracker";

const activeRequests = new Map<string, PromptOverlay>();
let visibleOverlay: PromptOverlay | null = null;

export function registerContentMessageHandler() {
  chrome.runtime.onMessage.addListener((message: ContentMessage) => {
    if (message.type === "START_ANALYZE") {
      void startAnalyze(message);
      return;
    }

    const overlay = activeRequests.get(message.requestId);
    if (!overlay) {
      return;
    }

    if (message.type === "STREAM_STATUS") {
      overlay.setStatus(message.status);
      return;
    }

    if (message.type === "STREAM_CHUNK") {
      overlay.append(message.chunk);
      return;
    }

    if (message.type === "STREAM_DONE") {
      overlay.complete();
      activeRequests.delete(message.requestId);
      return;
    }

    overlay.fail(message.error, {
      showSettingsAction: message.action === "open-settings" || message.code === "missing-settings"
    });
    activeRequests.delete(message.requestId);
  });
}

async function startAnalyze(message: StartAnalyzeMessage) {
  const image = resolveImageTarget(message.imageUrl, message.anchor);
  await startOverlayAnalysis({
    imageUrl: message.imageUrl,
    anchor: message.anchor,
    image,
    trigger: "context-menu"
  });
}

export async function startAnalyzeForImage(
  image: HTMLImageElement | null,
  trigger: AnalyzeImagePayload["trigger"] = "hover-button"
) {
  if (!image?.isConnected) {
    return;
  }

  const anchor = getSafeImageAnchor(image);
  const imageUrl = getImageSource(image);
  if (!imageUrl) {
    return;
  }

  await startOverlayAnalysis({
    imageUrl,
    anchor,
    image,
    trigger
  });
}

export function hasVisibleOverlay(): boolean {
  return visibleOverlay !== null;
}

async function sendAnalysisRequest(
  requestId: string,
  imageUrl: string,
  trigger: AnalyzeImagePayload["trigger"]
) {
  await chrome.runtime.sendMessage({
    type: "ANALYZE_IMAGE",
    requestId,
    payload: {
      imageUrl,
      pageUrl: window.location.href,
      pageTitle: document.title,
      trigger
    }
  });
}

async function rerunAnalysis(
  overlay: PromptOverlay,
  imageUrl: string,
  trigger: AnalyzeImagePayload["trigger"]
) {
  const staleEntries = Array.from(activeRequests.entries()).filter(([, current]) => current === overlay);
  for (const [requestId] of staleEntries) {
    activeRequests.delete(requestId);
  }

  const requestId = crypto.randomUUID();
  overlay.reset();
  overlay.setStatus("正在准备请求...");
  activeRequests.set(requestId, overlay);

  try {
    await sendAnalysisRequest(requestId, imageUrl, trigger);
  } catch (error) {
    activeRequests.delete(requestId);
    overlay.fail(error instanceof Error ? error.message : "发送分析请求失败，请稍后重试。");
  }
}

function createOverlay(options: {
  imageUrl: string;
  anchor: ImageAnchor | null;
  image: HTMLImageElement | null;
  trigger: AnalyzeImagePayload["trigger"];
}) {
  const { anchor, image, imageUrl, trigger } = options;
  const resolver = image
    ? createImageAnchorResolver(image)
    : createFallbackAnchorResolver(anchor);

  let overlay: PromptOverlay;
  overlay = new PromptOverlay(resolver, {
    onRetry: () => {
      void rerunAnalysis(overlay, imageUrl, trigger);
    },
    onOpenSettings: () => {
      void openOptionsPageFromContent();
    },
    onClose: () => {
      if (visibleOverlay === overlay) {
        visibleOverlay = null;
      }
      const staleEntries = Array.from(activeRequests.entries()).filter(([, current]) => current === overlay);
      for (const [requestId] of staleEntries) {
        activeRequests.delete(requestId);
      }
    },
    trackedNode: image
  });
  return overlay;
}

function getSafeImageAnchor(image: HTMLImageElement): ImageAnchor | null {
  try {
    return getImageAnchor(image);
  } catch {
    return null;
  }
}

async function startOverlayAnalysis(options: {
  imageUrl: string;
  anchor: ImageAnchor | null;
  image: HTMLImageElement | null;
  trigger: AnalyzeImagePayload["trigger"];
}) {
  destroyVisibleOverlay();
  activeRequests.clear();

  const overlay = createOverlay(options);
  visibleOverlay = overlay;
  overlay.reset();
  await rerunAnalysis(overlay, options.imageUrl, options.trigger);
}

function destroyVisibleOverlay() {
  const existing = visibleOverlay ?? Array.from(activeRequests.values())[0] ?? null;
  visibleOverlay = null;
  existing?.destroy();
}
