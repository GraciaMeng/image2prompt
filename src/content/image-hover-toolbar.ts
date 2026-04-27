import { hasVisibleOverlay, startAnalyzeForImage } from "./analyze-controller";
import { openOptionsPageFromContent } from "./extension-actions";
import { getVisibleImageRect, isHoverEligibleImage } from "./image-target-tracker";
import { ensureOverlayStyles } from "./prompt-overlay.css";

const TOOLBAR_ID = "image2prompt-hover-toolbar";
const VIEWPORT_MARGIN = 12;
const INSET_MARGIN = 16;
const TOOLBAR_LAYOUTS = {
  large: {
    width: 156,
    buttonHeight: 40,
    iconSize: 18,
    labelMode: "full" as const
  },
  medium: {
    width: 118,
    buttonHeight: 38,
    iconSize: 18,
    labelMode: "short" as const
  },
  small: {
    width: 52,
    buttonHeight: 36,
    iconSize: 18,
    labelMode: "icon" as const
  }
} as const;
type ToolbarMode = keyof typeof TOOLBAR_LAYOUTS;

export function startHoverToolbar() {
  if (document.getElementById(TOOLBAR_ID)) {
    return;
  }

  ensureOverlayStyles();

  const toolbar = document.createElement("div");
  toolbar.id = TOOLBAR_ID;
  toolbar.className = "image2prompt-hover-toolbar";
  toolbar.hidden = true;

  const analyzeButton = document.createElement("button");
  analyzeButton.type = "button";
  analyzeButton.className = "image2prompt-hover-button is-primary";
  analyzeButton.setAttribute("aria-label", "分析图片并提取 Prompt");
  analyzeButton.append(
    buildIconShell("image2prompt-hover-analyze-icon", `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 3.5 13.9 8.1 18.5 10 13.9 11.9 12 16.5 10.1 11.9 5.5 10 10.1 8.1 12 3.5Z" />
        <path d="M18.2 4.2v3.2M16.6 5.8h3.2" />
      </svg>
    `),
    buildButtonText({
      full: "提取提示词",
      short: "提取",
      tooltip: "提取"
    })
  );

  const settingsButton = document.createElement("button");
  settingsButton.type = "button";
  settingsButton.className = "image2prompt-hover-button";
  settingsButton.setAttribute("aria-label", "打开设置页");
  settingsButton.append(
    buildIconShell("image2prompt-hover-settings-icon", `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 7.2v-2" />
        <path d="M12 18.8v-2" />
        <path d="M7.8 12h-2" />
        <path d="M18.2 12h-2" />
        <path d="m8.9 8.9-1.4-1.4" />
        <path d="m16.5 16.5-1.4-1.4" />
        <path d="m8.9 15.1-1.4 1.4" />
        <path d="m16.5 7.5-1.4 1.4" />
        <circle cx="12" cy="12" r="3.1" />
      </svg>
    `),
    buildButtonText({
      full: "设置",
      short: "设置",
      tooltip: "设置"
    })
  );

  toolbar.append(analyzeButton, settingsButton);
  document.body.appendChild(toolbar);

  let activeImage: HTMLImageElement | null = null;
  let hideTimer: number | null = null;
  let frame: number | null = null;
  let pendingAnalyze = false;
  const boundImages = new WeakSet<HTMLImageElement>();
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

  const clearHideTimer = () => {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
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

      const viewportTop = window.visualViewport?.offsetTop ?? 0;
      const viewportLeft = window.visualViewport?.offsetLeft ?? 0;
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const mode = getToolbarMode(visibleRect, viewportWidth, viewportHeight);
      const layout = TOOLBAR_LAYOUTS[mode];
      toolbar.dataset.mode = mode;
      toolbar.style.setProperty("--toolbar-button-height", `${layout.buttonHeight}px`);
      toolbar.style.setProperty("--toolbar-icon-size", `${layout.iconSize}px`);
      toolbar.style.setProperty("--toolbar-padding-inline", mode === "large" ? "10px" : mode === "medium" ? "8px" : "7px");
      toolbar.style.setProperty("--toolbar-gap", mode === "large" ? "6px" : "4px");
      toolbar.hidden = false;
      toolbar.style.visibility = "hidden";
      const toolbarWidth = toolbar.offsetWidth || layout.width;
      const toolbarHeight = toolbar.offsetHeight || layout.buttonHeight * 2 + 16;
      const viewportMinTop = viewportTop + VIEWPORT_MARGIN;
      const viewportMaxTop = viewportTop + viewportHeight - toolbarHeight - VIEWPORT_MARGIN;
      const viewportMinLeft = viewportLeft + VIEWPORT_MARGIN;
      const viewportMaxLeft = viewportLeft + viewportWidth - toolbarWidth - VIEWPORT_MARGIN;
      const canFitVertically = visibleRect.height >= toolbarHeight + INSET_MARGIN * 2;
      const canFitHorizontally = visibleRect.width >= toolbarWidth + INSET_MARGIN * 2;
      const preferredTop = canFitVertically
        ? visibleRect.top + INSET_MARGIN
        : visibleRect.top + (visibleRect.height - toolbarHeight) / 2;
      const preferredLeft = canFitHorizontally
        ? visibleRect.right - toolbarWidth - 8
        : visibleRect.left + (visibleRect.width - toolbarWidth) / 2;
      const top = clamp(preferredTop, viewportMinTop, Math.max(viewportMinTop, viewportMaxTop));
      const left = clamp(preferredLeft, viewportMinLeft, Math.max(viewportMinLeft, viewportMaxLeft));

      toolbar.style.top = `${top}px`;
      toolbar.style.left = `${left}px`;
      toolbar.style.visibility = "";
      toolbar.dataset.visible = "true";
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
    clearHideTimer();
    activeImage = null;
    toolbar.hidden = true;
    toolbar.style.visibility = "";
    toolbar.dataset.visible = "false";
  };

  toolbar.addEventListener("pointerenter", () => {
    clearHideTimer();
  });

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

  analyzeButton.addEventListener("click", async () => {
    const targetImage = activeImage;
    if (!targetImage) {
      return;
    }

    pendingAnalyze = true;
    analyzeButton.disabled = true;
    try {
      hideToolbar();
      await startAnalyzeForImage(targetImage, "hover-button");
    } finally {
      pendingAnalyze = false;
      analyzeButton.disabled = false;
    }
  });

  settingsButton.addEventListener("click", () => {
    void openOptionsPageFromContent();
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getToolbarMode(visibleRect: Pick<DOMRectReadOnly, "width" | "height">, viewportWidth: number, viewportHeight: number): ToolbarMode {
  const fitsLarge =
    visibleRect.width >= 420 &&
    visibleRect.height >= 280 &&
    viewportWidth >= 520 &&
    viewportHeight >= 360;
  const fitsMedium = visibleRect.width >= 180 && visibleRect.height >= 120;
  const fitsSmall = visibleRect.width >= 96 && visibleRect.height >= 88;

  if (fitsLarge) {
    return "large";
  }

  if (fitsMedium) {
    return "medium";
  }

  if (fitsSmall) {
    return "small";
  }

  return "small";
}

function buildIconShell(className: string, svgMarkup: string) {
  const shell = document.createElement("span");
  shell.className = `image2prompt-hover-icon-shell ${className}`;
  shell.setAttribute("aria-hidden", "true");
  shell.innerHTML = `
    <span class="image2prompt-hover-icon">
      ${svgMarkup}
    </span>
  `;
  return shell;
}

function buildButtonText(options: { full: string; short: string; tooltip: string }) {
  const wrapper = document.createElement("span");
  wrapper.className = "image2prompt-hover-text-wrap";

  const full = document.createElement("span");
  full.className = "image2prompt-hover-label is-full";
  full.textContent = options.full;

  const short = document.createElement("span");
  short.className = "image2prompt-hover-label is-short";
  short.textContent = options.short;

  const tooltip = document.createElement("span");
  tooltip.className = "image2prompt-hover-tooltip";
  tooltip.textContent = options.tooltip;

  wrapper.append(full, short, tooltip);
  return wrapper;
}
