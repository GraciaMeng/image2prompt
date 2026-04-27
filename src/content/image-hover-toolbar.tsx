import ReactDOM from "react-dom/client";
import { hasVisibleOverlay, startAnalyzeForImage } from "./analyze-controller";
import { openOptionsPageFromContent } from "./extension-actions";
import { getVisibleImageRect, isHoverEligibleImage, type VisibleImageRect } from "./image-target-tracker";
import { ensureOverlayStyles } from "./prompt-overlay-style";
import { HoverToolbar, type ToolbarMode } from "./content-ui";

const TOOLBAR_ID = "image2prompt-hover-toolbar";
const VIEWPORT_MARGIN = 4;
const INSET_MARGIN = 4;
export function startHoverToolbar() {
  if (document.getElementById(TOOLBAR_ID)) {
    return;
  }

  ensureOverlayStyles();

  const toolbar = document.createElement("div");
  toolbar.id = TOOLBAR_ID;
  document.body.appendChild(toolbar);
  const root = ReactDOM.createRoot(toolbar);

  let activeImage: HTMLImageElement | null = null;
  let hideTimer: number | null = null;
  let frame: number | null = null;
  const boundImages = new WeakSet<HTMLImageElement>();
  let mode: ToolbarMode = "small";
  let visible = false;
  let positioned = false;
  let left = 0;
  let top = 0;
  let analyzeDisabled = false;

  const render = () =>
    root.render(
      <HoverToolbar
        mode={mode}
        visible={visible}
        positioned={positioned}
        left={left}
        top={top}
        analyzeDisabled={analyzeDisabled}
        onAnalyze={() => {
          void handleAnalyze();
        }}
        onOpenSettings={() => {
          void openOptionsPageFromContent();
        }}
      />
    );

  const clearHideTimer = () => {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const scheduleUpdate = () => {
    if (!activeImage || frame !== null) {
      return;
    }

    frame = window.requestAnimationFrame(() => {
      frame = null;
      if (!activeImage || !document.contains(activeImage) || hasVisibleOverlay()) {
        hideToolbar();
        return;
      }

      const visibleRect = getVisibleImageRect(activeImage);
      if (!visibleRect) {
        hideToolbar();
        return;
      }

      const nextMode = getToolbarMode(visibleRect);
      const wasVisible = visible && positioned;
      const modeChanged = mode !== nextMode;
      mode = nextMode;

      if (!visible) {
        visible = true;
        positioned = false;
        render();
      } else if (modeChanged) {
        render();
      }

      const measureAndRender = () => {
        if (!activeImage || !document.contains(activeImage) || hasVisibleOverlay()) {
          hideToolbar();
          return;
        }

        const latestVisibleRect = getVisibleImageRect(activeImage);
        const toolbarElement = getToolbarElement(toolbar);
        if (!latestVisibleRect || !toolbarElement) {
          hideToolbar();
          return;
        }

        const toolbarRect = toolbarElement.getBoundingClientRect();
        const position = getToolbarPosition({
          imageRect: latestVisibleRect,
          toolbarRect: {
            width: toolbarRect.width,
            height: toolbarRect.height
          },
          viewportRect: getViewportRect()
        });
        top = position.top;
        left = position.left;
        positioned = true;
        render();
      };

      if (!wasVisible || modeChanged) {
        window.requestAnimationFrame(measureAndRender);
        return;
      }

      measureAndRender();
    });
  };

  const showToolbar = (image: HTMLImageElement | null) => {
    if (!image || hasVisibleOverlay() || !isHoverEligibleImage(image)) {
      return;
    }

    clearHideTimer();
    activeImage = image;
    scheduleUpdate();
  };

  const hideToolbar = () => {
    if (!visible && !positioned && activeImage === null) {
      return;
    }

    clearHideTimer();
    activeImage = null;
    visible = false;
    positioned = false;
    render();
  };

  const handleAnalyze = async () => {
    const targetImage = activeImage;
    if (!targetImage) {
      return;
    }

    analyzeDisabled = true;
    render();
    try {
      hideToolbar();
      await startAnalyzeForImage(targetImage, "hover-button");
    } finally {
      analyzeDisabled = false;
      render();
    }
  };

  const bindImage = (image: HTMLImageElement) => {
    if (boundImages.has(image)) {
      return;
    }

    boundImages.add(image);
    image.addEventListener("pointerenter", () => {
      if (isHoverEligibleImage(image)) {
        showToolbar(image);
      }
    });
    image.addEventListener("pointerleave", (event) => {
      const relatedTarget = event.relatedTarget as Node | null;
      if (relatedTarget && toolbar.contains(relatedTarget)) {
        return;
      }

      if (activeImage === image) {
        hideToolbar();
      }
    });
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLImageElement) {
          bindImage(node);
        } else if (node instanceof HTMLElement) {
          node.querySelectorAll("img").forEach((image) => bindImage(image as HTMLImageElement));
        }
      }
    }
  });

  const startObservingImages = () => {
    if (!document.body) {
      return;
    }

    observer.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll("img").forEach((image) => bindImage(image as HTMLImageElement));
  };

  if (document.body) {
    startObservingImages();
  } else {
    document.addEventListener("DOMContentLoaded", startObservingImages, { once: true });
  }

  document.addEventListener(
    "load",
    (event) => {
      if (event.target instanceof HTMLImageElement) {
        bindImage(event.target);
      }
    },
    true
  );

  toolbar.addEventListener("pointerenter", clearHideTimer);
  toolbar.addEventListener("pointerleave", (event) => {
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && activeImage?.contains(relatedTarget)) {
      return;
    }

    if (activeImage) {
      hideToolbar();
    }
  });

  document.addEventListener(
    "scroll",
    () => {
      if (activeImage && !hasVisibleOverlay()) {
        scheduleUpdate();
      } else {
        hideToolbar();
      }
    },
    true
  );

  window.addEventListener("resize", () => {
    if (activeImage && !hasVisibleOverlay()) {
      scheduleUpdate();
    } else {
      hideToolbar();
    }
  });

  window.visualViewport?.addEventListener("resize", () => {
    if (activeImage && !hasVisibleOverlay()) {
      scheduleUpdate();
    } else {
      hideToolbar();
    }
  });

  window.visualViewport?.addEventListener("scroll", () => {
    if (activeImage && !hasVisibleOverlay()) {
      scheduleUpdate();
    } else {
      hideToolbar();
    }
  });

  render();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getToolbarElement(container: HTMLDivElement): HTMLElement | null {
  const candidate = container.firstElementChild;
  return candidate instanceof HTMLElement ? candidate : null;
}

export function getToolbarPosition(args: {
  imageRect: Pick<VisibleImageRect, "top" | "left" | "right" | "width" | "height">;
  toolbarRect: Pick<DOMRectReadOnly, "width" | "height">;
  viewportRect: { top: number; left: number; width: number; height: number };
}) {
  const { imageRect, toolbarRect, viewportRect } = args;
  const viewportMinTop = viewportRect.top + VIEWPORT_MARGIN;
  const viewportMinLeft = viewportRect.left + VIEWPORT_MARGIN;
  const viewportMaxTop = viewportRect.top + viewportRect.height - toolbarRect.height - VIEWPORT_MARGIN;
  const viewportMaxLeft = viewportRect.left + viewportRect.width - toolbarRect.width - VIEWPORT_MARGIN;
  const canFitVertically = imageRect.height >= toolbarRect.height + INSET_MARGIN * 2;
  const canFitHorizontally = imageRect.width >= toolbarRect.width + INSET_MARGIN * 2;
  const preferredTop = canFitVertically
    ? imageRect.top + INSET_MARGIN
    : imageRect.top + (imageRect.height - toolbarRect.height) / 2;
  const preferredLeft = canFitHorizontally
    ? imageRect.right - toolbarRect.width - INSET_MARGIN
    : imageRect.left + (imageRect.width - toolbarRect.width) / 2;

  return {
    top: clamp(preferredTop, viewportMinTop, Math.max(viewportMinTop, viewportMaxTop)),
    left: clamp(preferredLeft, viewportMinLeft, Math.max(viewportMinLeft, viewportMaxLeft))
  };
}

function getViewportRect() {
  return {
    top: window.visualViewport?.offsetTop ?? 0,
    left: window.visualViewport?.offsetLeft ?? 0,
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight
  };
}

function getToolbarMode(imageRect: Pick<DOMRectReadOnly, "width" | "height">): ToolbarMode {
  if (imageRect.width >= 420 && imageRect.height >= 280) {
    return "large";
  }

  if (imageRect.width >= 180 && imageRect.height >= 120) {
    return "medium";
  }

  return "small";
}
