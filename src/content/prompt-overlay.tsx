import { createRoot, type Root } from "react-dom/client";
import { getImageAnchor } from "../shared/image";
import type { ImageAnchor } from "../shared/types";
import { ensureOverlayStyles } from "./prompt-overlay-style";
import { PromptOverlayView, type OverlayPhase } from "./content-ui";

type PromptOverlayOptions = {
  onRetry: () => void;
  onOpenSettings?: () => void;
  onClose?: () => void;
  trackedNode?: HTMLElement | null;
};

type AnchorResolver = () => ImageAnchor;

const CARD_WIDTH = 348;
const CARD_MARGIN = 16;
const VIEWPORT_MARGIN = 12;
const COPY_RESET_DELAY = 1500;

export class PromptOverlay {
  private readonly host: HTMLDivElement;
  private readonly shell: HTMLDivElement;
  private readonly root: Root;
  private readonly cleanupFns: Array<() => void> = [];
  private accumulated = "";
  private destroyed = false;
  private copyResetTimer: number | null = null;
  private repositionFrame: number | null = null;
  private phase: OverlayPhase = "preparing";
  private statusText = "正在准备图片分析任务...";
  private metaText = "准备就绪";
  private footerHint = "面板会跟随图片位置自动贴边";
  private copyLabel = "复制文本";
  private copyDisabled = true;
  private retryDisabled = true;
  private settingsHidden = true;
  private bodyText = "准备读取图片信息并发起 Prompt 提取...";

  constructor(
    private readonly resolveAnchor: AnchorResolver,
    private readonly options: PromptOverlayOptions
  ) {
    ensureOverlayStyles();
    this.host = document.createElement("div");
    this.host.className = "image2prompt-layer";
    this.host.setAttribute("role", "dialog");
    this.host.setAttribute("aria-live", "polite");
    this.host.dataset.phase = "preparing";
    this.shell = document.createElement("div");
    this.host.append(this.shell);
    document.body.appendChild(this.host);
    this.root = createRoot(this.shell);
    this.bindLifecycleEvents();
    this.render();
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

    if (!this.accumulated.trim()) {
      this.syncContent();
    }

    this.updatePhase("success", "Prompt 已生成，可直接复制并继续复用。", "结果已生成");
    this.copyDisabled = !this.accumulated.trim();
    this.retryDisabled = false;
    this.settingsHidden = true;
    this.footerHint = "结果已固定，可复制到你常用的工作流里继续使用";
    this.render();
  }

  fail(error: string, options: { showSettingsAction?: boolean } = {}) {
    if (this.destroyed) {
      return;
    }

    const message = error.trim() || "分析失败，请稍后重试。";
    this.bodyText = `错误：${message}`;
    this.updatePhase("error", message, "分析失败");
    this.copyDisabled = true;
    this.retryDisabled = false;
    this.settingsHidden = !options.showSettingsAction;
    this.footerHint = options.showSettingsAction
      ? "先补齐配置并保存，再回来重试，不需要重新选择图片"
      : "你可以直接重试，不需要重新选择图片";
    this.render();
  }

  reset() {
    if (this.destroyed) {
      return;
    }

    this.accumulated = "";
    this.clearTimers();
    this.copyLabel = "复制文本";
    this.copyDisabled = true;
    this.retryDisabled = true;
    this.settingsHidden = true;
    this.footerHint = "分析面板会跟随图片位置更新";
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
    this.root.unmount();
    this.host.remove();
    this.options.onClose?.();
  }

  private updatePhase(phase: OverlayPhase, status: string, meta: string) {
    this.phase = phase;
    this.host.dataset.phase = phase;
    this.statusText = status;
    this.metaText = meta;
    this.render();
  }

  private syncContent() {
    this.bodyText = this.accumulated.trim() || "准备读取图片信息并发起 Prompt 提取...";
    this.render();
  }

  private async handleCopy() {
    if (!this.accumulated.trim() || this.copyDisabled) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.accumulated);
      this.copyLabel = "已复制";
      this.footerHint = "复制成功，可以直接粘贴到你常用的 AI 或绘图工具里";
      this.render();
      this.copyResetTimer = window.setTimeout(() => {
        if (this.destroyed) {
          return;
        }
        this.copyLabel = "复制文本";
        this.footerHint =
          this.phase === "success"
            ? "结果已固定，可复制到你常用的工作流里继续使用"
            : "分析面板会跟随图片位置更新";
        this.render();
      }, COPY_RESET_DELAY);
    } catch {
      this.footerHint = "复制失败，请检查页面剪贴板权限";
      this.render();
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
      const listener = () => this.scheduleReposition();
      target.addEventListener("scroll", listener, { passive: true });
      this.cleanupFns.push(() => target.removeEventListener("scroll", listener));
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

    const left = clamp(
      hasRoomRight ? rightAlignedLeft : leftAlignedLeft,
      viewportLeft + VIEWPORT_MARGIN,
      viewportLeft + viewportWidth - CARD_WIDTH - VIEWPORT_MARGIN
    );

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

  private render() {
    this.root.render(
      <PromptOverlayView
        phase={this.phase}
        statusText={this.statusText}
        metaText={this.metaText}
        bodyText={this.bodyText}
        footerHint={this.footerHint}
        copyDisabled={this.copyDisabled}
        retryDisabled={this.retryDisabled}
        settingsHidden={this.settingsHidden}
        copyLabel={this.copyLabel}
        onClose={() => this.destroy()}
        onCopy={() => {
          void this.handleCopy();
        }}
        onRetry={() => {
          this.reset();
          this.options.onRetry();
        }}
        onOpenSettings={() => {
          this.options.onOpenSettings?.();
        }}
      />
    );
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

  if (value.includes("完成") || value.includes("成功") || value.includes("done") || value.includes("完成生成")) {
    return { phase: "success", meta: "已完成" };
  }

  if (value.includes("准备") || value.includes("排队") || value.includes("请求") || value.includes("上传")) {
    return { phase: "preparing", meta: "准备中" };
  }

  return { phase: "streaming", meta: "分析中" };
}

function getScrollParents(element: HTMLElement): EventTarget[] {
  const targets: EventTarget[] = [window];
  let current: HTMLElement | null = element;

  while (current) {
    const style = window.getComputedStyle(current);
    if (/(auto|scroll|overlay)/.test(`${style.overflow}${style.overflowX}${style.overflowY}`)) {
      targets.push(current);
    }

    if (current === document.body) {
      break;
    }

    current = current.parentElement;
  }

  return targets;
}
