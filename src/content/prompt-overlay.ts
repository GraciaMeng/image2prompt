import { getImageAnchor } from "../shared/image";
import type { ImageAnchor } from "../shared/types";
import { ensureOverlayStyles } from "./prompt-overlay.css";

type PromptOverlayOptions = {
  onRetry: () => void;
  onOpenSettings?: () => void;
  onClose?: () => void;
  trackedNode?: HTMLElement | null;
};

type AnchorResolver = () => ImageAnchor;

type OverlayPhase = "preparing" | "streaming" | "success" | "error";

const CARD_WIDTH = 348;
const CARD_MARGIN = 16;
const VIEWPORT_MARGIN = 12;
const COPY_RESET_DELAY = 1500;
export class PromptOverlay {
  private readonly host: HTMLDivElement;
  private readonly shell: HTMLDivElement;
  private readonly copyButton: HTMLButtonElement;
  private readonly retryButton: HTMLButtonElement;
  private readonly settingsButton: HTMLButtonElement;
  private readonly statusText: HTMLSpanElement;
  private readonly footerHint: HTMLSpanElement;
  private readonly trustNote: HTMLDivElement;
  private readonly bodyText: HTMLPreElement;
  private readonly cleanupFns: Array<() => void> = [];
  private readonly scrollParents = new Set<EventTarget>();

  private accumulated = "";
  private destroyed = false;
  private copyResetTimer: number | null = null;
  private repositionFrame: number | null = null;
  private lastPhase: OverlayPhase = "preparing";

  constructor(
    private readonly resolveAnchor: AnchorResolver,
    private readonly options: PromptOverlayOptions
  ) {
    ensureOverlayStyles();
    destroyExistingOverlayNodes();

    this.host = document.createElement("div");
    this.host.className = "image2prompt-layer";
    this.host.setAttribute("role", "dialog");
    this.host.setAttribute("aria-live", "polite");
    this.host.dataset.phase = "preparing";

    this.shell = document.createElement("div");
    this.shell.className = "image2prompt-card";
    this.shell.dataset.phase = "preparing";

    const header = document.createElement("div");
    header.className = "image2prompt-header";

    const titleWrap = document.createElement("div");
    titleWrap.className = "image2prompt-title-wrap";

    const title = document.createElement("div");
    title.className = "image2prompt-title";
    title.textContent = "抽取提示词";

    const subtitle = document.createElement("span");
    subtitle.className = "image2prompt-header-meta";
    subtitle.textContent = "正在将图片内容整理成可直接复用的提示词";
    titleWrap.append(title, subtitle);

    const closeButton = document.createElement("button");
    closeButton.className = "image2prompt-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "关闭浮层");
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => this.destroy());
    header.append(titleWrap, closeButton);

    const status = document.createElement("div");
    status.className = "image2prompt-status";
    const dot = document.createElement("span");
    dot.className = "image2prompt-dot";
    this.statusText = document.createElement("span");
    this.statusText.className = "image2prompt-status-text";
    this.statusText.textContent = "正在准备图片分析任务...";
    status.append(dot, this.statusText);

    this.trustNote = document.createElement("div");
    this.trustNote.className = "image2prompt-trust-note";
    this.trustNote.textContent = "结果会保留在本地页面浮层中，可随时复制或重试。";

    this.bodyText = document.createElement("pre");
    this.bodyText.className = "image2prompt-content";
    this.bodyText.textContent = "准备读取图片信息并发起 Prompt 提取...";

    const actions = document.createElement("div");
    actions.className = "image2prompt-actions";

    this.copyButton = document.createElement("button");
    this.copyButton.className = "image2prompt-copy";
    this.copyButton.type = "button";
    this.copyButton.textContent = "复制文本";
    this.copyButton.disabled = true;
    this.copyButton.addEventListener("click", () => {
      void this.handleCopy();
    });

    this.retryButton = document.createElement("button");
    this.retryButton.className = "image2prompt-retry";
    this.retryButton.type = "button";
    this.retryButton.textContent = "重新分析";
    this.retryButton.disabled = true;
    this.retryButton.addEventListener("click", () => {
      this.reset();
      this.options.onRetry();
    });

    this.settingsButton = document.createElement("button");
    this.settingsButton.className = "image2prompt-settings";
    this.settingsButton.type = "button";
    this.settingsButton.textContent = "去设置";
    this.settingsButton.hidden = true;
    this.settingsButton.addEventListener("click", () => {
      this.options.onOpenSettings?.();
    });

    actions.append(this.retryButton, this.copyButton, this.settingsButton);

    const footer = document.createElement("div");
    footer.className = "image2prompt-footer";

    this.footerHint = document.createElement("span");
    this.footerHint.className = "image2prompt-footer-hint";
    this.footerHint.textContent = "面板会跟随图片位置自动贴边";
    footer.append(this.footerHint);

    this.shell.append(header, status, this.trustNote, this.bodyText, actions, footer);
    this.host.append(this.shell);
    document.body.appendChild(this.host);

    this.bindLifecycleEvents();
    this.updatePhase("preparing", "正在准备图片分析任务...", "准备就绪");
    this.syncContent();
    this.scheduleReposition();
  }

  append(chunk: string) {
    if (this.destroyed) {
      return;
    }

    this.accumulated += chunk;
    this.syncContent();
    this.updatePhase("streaming", "正在分析图片并提取可复用 Prompt...", "分析进行中");
  }

  setStatus(status: string) {
    if (this.destroyed) {
      return;
    }

    const normalized = normalizePhase(status);
    this.updatePhase(normalized.phase, status, normalized.meta);
  }

  complete() {
    if (this.destroyed) {
      return;
    }

    const content = this.accumulated.trim();
    if (!content) {
      this.syncContent();
    }

    this.updatePhase("success", "Prompt 已生成，可直接复制并继续复用。", "结果已生成");
    this.copyButton.disabled = !this.accumulated.trim();
    this.retryButton.disabled = false;
    this.settingsButton.hidden = true;
    this.footerHint.textContent = "结果已固定，可复制到你常用的工作流里继续使用";
  }

  fail(error: string, options: { showSettingsAction?: boolean } = {}) {
    if (this.destroyed) {
      return;
    }

    const message = error.trim() || "分析失败，请稍后重试。";
    this.bodyText.textContent = `错误：${message}`;
    this.updatePhase("error", message, "分析失败");
    this.copyButton.disabled = true;
    this.retryButton.disabled = false;
    this.settingsButton.hidden = !options.showSettingsAction;
    this.footerHint.textContent = options.showSettingsAction
      ? "先补齐配置并保存，再回来重试，不需要重新选择图片"
      : "你可以直接重试，不需要重新选择图片";
  }

  reset() {
    if (this.destroyed) {
      return;
    }

    this.accumulated = "";
    this.clearTimers();
    this.copyButton.textContent = "复制文本";
    this.copyButton.disabled = true;
    this.retryButton.disabled = true;
    this.settingsButton.hidden = true;
    this.footerHint.textContent = "分析面板会跟随图片位置更新";
    this.syncContent();
    this.updatePhase("preparing", "正在准备图片分析任务...", "准备就绪");
    this.scheduleReposition();
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.clearTimers();
    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns.length = 0;
    this.host.remove();
    this.options.onClose?.();
  }

  private updatePhase(phase: OverlayPhase, status: string, meta: string) {
    this.lastPhase = phase;
    this.host.dataset.phase = phase;
    this.shell.dataset.phase = phase;
    this.statusText.textContent = status;
    this.trustNote.textContent = meta;
  }

  private syncContent() {
    const text = this.accumulated.trim();
    const fallback = "准备读取图片信息并发起 Prompt 提取...";
    this.bodyText.textContent = text || fallback;
    this.bodyText.className = "image2prompt-content";
  }

  private async handleCopy() {
    if (!this.accumulated.trim() || this.copyButton.disabled) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.accumulated);
      this.copyButton.textContent = "已复制";
      this.footerHint.textContent = "复制成功，可以直接粘贴到你常用的 AI 或绘图工具里";
      this.copyResetTimer = window.setTimeout(() => {
        if (this.destroyed) {
          return;
        }
        this.copyButton.textContent = "复制文本";
        this.footerHint.textContent =
          this.lastPhase === "success"
            ? "结果已固定，可复制到你常用的工作流里继续使用"
            : "分析面板会跟随图片位置更新";
      }, COPY_RESET_DELAY);
    } catch {
      this.footerHint.textContent = "复制失败，请检查页面剪贴板权限";
    }
  }

  private bindLifecycleEvents() {
    const onScrollOrResize = () => this.scheduleReposition();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        this.destroy();
      }
    };

    window.addEventListener("resize", onScrollOrResize);
    window.visualViewport?.addEventListener("resize", onScrollOrResize);
    window.visualViewport?.addEventListener("scroll", onScrollOrResize);
    document.addEventListener("keydown", onKeyDown, true);

    this.cleanupFns.push(() => window.removeEventListener("resize", onScrollOrResize));
    if (window.visualViewport) {
      this.cleanupFns.push(() => window.visualViewport?.removeEventListener("resize", onScrollOrResize));
      this.cleanupFns.push(() => window.visualViewport?.removeEventListener("scroll", onScrollOrResize));
    }
    this.cleanupFns.push(() => document.removeEventListener("keydown", onKeyDown, true));

    for (const target of getScrollParents(this.options.trackedNode ?? this.host)) {
      if (this.scrollParents.has(target)) {
        continue;
      }

      const listener = () => this.scheduleReposition();
      target.addEventListener("scroll", listener, { passive: true });
      this.cleanupFns.push(() => target.removeEventListener("scroll", listener));
      this.scrollParents.add(target);
    }
  }

  private scheduleReposition() {
    if (this.destroyed || this.repositionFrame !== null) {
      return;
    }

    this.repositionFrame = window.requestAnimationFrame(() => {
      this.repositionFrame = null;
      this.reposition();
    });
  }

  private reposition() {
    if (this.destroyed || !document.body.contains(this.host)) {
      return;
    }

    const anchor = this.resolveAnchor();
    const anchorTop = anchor.top - window.scrollY;
    const anchorLeft = anchor.left - window.scrollX;
    const viewportTop = window.visualViewport?.offsetTop ?? 0;
    const viewportLeft = window.visualViewport?.offsetLeft ?? 0;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    const hasRoomRight = anchorLeft + anchor.width + CARD_MARGIN + CARD_WIDTH <= viewportLeft + viewportWidth;
    const rightAlignedLeft = anchorLeft + anchor.width + CARD_MARGIN;
    const leftAlignedLeft = anchorLeft - CARD_MARGIN - CARD_WIDTH;

    let left = hasRoomRight ? rightAlignedLeft : leftAlignedLeft;
    left = clamp(left, viewportLeft + VIEWPORT_MARGIN, viewportLeft + viewportWidth - CARD_WIDTH - VIEWPORT_MARGIN);

    const maxTop = viewportTop + viewportHeight - this.host.offsetHeight - VIEWPORT_MARGIN;
    const preferredTop = anchorTop;
    const centerTop = anchorTop + anchor.height / 2 - this.host.offsetHeight / 2;
    const top = clamp(preferredTop, viewportTop + VIEWPORT_MARGIN, Math.max(viewportTop + VIEWPORT_MARGIN, maxTop));
    const adjustedTop = top === viewportTop + VIEWPORT_MARGIN || top === maxTop ? centerTop : top;

    this.host.style.top = `${clamp(
      adjustedTop,
      viewportTop + VIEWPORT_MARGIN,
      Math.max(viewportTop + VIEWPORT_MARGIN, maxTop)
    )}px`;
    this.host.style.left = `${left}px`;
  }

  private clearTimers() {
    if (this.copyResetTimer !== null) {
      window.clearTimeout(this.copyResetTimer);
      this.copyResetTimer = null;
    }

    if (this.repositionFrame !== null) {
      window.cancelAnimationFrame(this.repositionFrame);
      this.repositionFrame = null;
    }
  }
}

export function createImageAnchorResolver(image: HTMLImageElement): AnchorResolver {
  return () => getImageAnchor(image);
}

export function createFallbackAnchorResolver(anchor: ImageAnchor | null): AnchorResolver {
  return () =>
    anchor ?? {
      top: window.scrollY + (window.visualViewport?.offsetTop ?? 24),
      left:
        window.scrollX +
        (window.visualViewport?.offsetLeft ?? 0) +
        (window.visualViewport?.width ?? window.innerWidth) -
        CARD_WIDTH -
        24,
      width: CARD_WIDTH,
      height: 120
    };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizePhase(status: string): { phase: OverlayPhase; meta: string } {
  const value = status.trim().toLowerCase();

  if (value.includes("失败") || value.includes("error")) {
    return { phase: "error", meta: "失败" };
  }

  if (
    value.includes("完成") ||
    value.includes("成功") ||
    value.includes("done") ||
    value.includes("完成生成")
  ) {
    return { phase: "success", meta: "已完成" };
  }

  if (
    value.includes("准备") ||
    value.includes("排队") ||
    value.includes("请求") ||
    value.includes("上传")
  ) {
    return { phase: "preparing", meta: "准备中" };
  }

  return { phase: "streaming", meta: "分析中" };
}

function getScrollParents(element: HTMLElement): EventTarget[] {
  const targets: EventTarget[] = [window];
  let current: HTMLElement | null = element;

  while (current) {
    const style = window.getComputedStyle(current);
    const overflowValue = `${style.overflow}${style.overflowX}${style.overflowY}`;
    if (/(auto|scroll|overlay)/.test(overflowValue)) {
      targets.push(current);
    }
    if (current === document.body) {
      break;
    }
    current = current.parentElement;
  }

  return targets;
}

function destroyExistingOverlayNodes() {
  for (const node of document.querySelectorAll(".image2prompt-layer")) {
    node.remove();
  }
}
