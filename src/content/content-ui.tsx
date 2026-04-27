export type ToolbarMode = "large" | "medium" | "small";
export type OverlayPhase = "preparing" | "streaming" | "success" | "error";

export function HoverToolbar(props: {
  mode: ToolbarMode;
  visible: boolean;
  positioned: boolean;
  left: number;
  top: number;
  analyzeDisabled: boolean;
  onAnalyze: () => void;
  onOpenSettings: () => void;
}) {
  if (!props.visible) {
    return null;
  }
  return (
    <div
      className="image2prompt-hover-toolbar"
      data-mode={props.mode}
      data-visible="true"
      style={{
        left: `${props.left}px`,
        top: `${props.top}px`,
        visibility: props.positioned ? "visible" : "hidden",
        pointerEvents: props.positioned ? "auto" : "none"
      }}
    >
      <button
        type="button"
        className="image2prompt-hover-button is-primary"
        aria-label="分析图片并提取 Prompt"
        onClick={props.onAnalyze}
        disabled={props.analyzeDisabled}
      >
        <span className="image2prompt-hover-icon-shell" aria-hidden="true">
          <span className="image2prompt-hover-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 3.5 13.9 8.1 18.5 10 13.9 11.9 12 16.5 10.1 11.9 5.5 10 10.1 8.1 12 3.5Z" />
              <path d="M18.2 4.2v3.2M16.6 5.8h3.2" />
            </svg>
          </span>
        </span>
        <span className="image2prompt-hover-text-wrap">
          <span className="image2prompt-hover-label is-full">提取提示词</span>
          <span className="image2prompt-hover-label is-short">提取</span>
          <span className="image2prompt-hover-tooltip">提取</span>
        </span>
      </button>
      <button type="button" className="image2prompt-hover-button" aria-label="打开设置页" onClick={props.onOpenSettings}>
        <span className="image2prompt-hover-icon-shell" aria-hidden="true">
          <span className="image2prompt-hover-icon">
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
          </span>
        </span>
        <span className="image2prompt-hover-text-wrap">
          <span className="image2prompt-hover-label is-full">设置</span>
          <span className="image2prompt-hover-label is-short">设置</span>
          <span className="image2prompt-hover-tooltip">设置</span>
        </span>
      </button>
    </div>
  )
}

export function PromptOverlayView(props: {
  phase: OverlayPhase;
  statusText: string;
  metaText: string;
  bodyText: string;
  footerHint: string;
  copyDisabled: boolean;
  retryDisabled: boolean;
  settingsHidden: boolean;
  copyLabel: string;
  onClose: () => void;
  onCopy: () => void;
  onRetry: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="image2prompt-card" data-phase={props.phase}>
      <div className="image2prompt-header">
        <div className="image2prompt-title-wrap">
          <div className="image2prompt-title">提取提示词</div>
          <span className="image2prompt-header-meta">正在将图片内容整理成可直接复用的提示词</span>
        </div>
        <button className="image2prompt-close" type="button" aria-label="关闭浮层" onClick={props.onClose}>
          ×
        </button>
      </div>

      <div className="image2prompt-status">
        <span className="image2prompt-dot" />
        <span className="image2prompt-status-text">{props.statusText}</span>
      </div>

      <div className="image2prompt-trust-note">{props.metaText}</div>

      <pre className="image2prompt-content">{props.bodyText}</pre>

      <div className="image2prompt-actions">
        <button className="image2prompt-retry" type="button" onClick={props.onRetry} disabled={props.retryDisabled}>
          重新分析
        </button>
        <button className="image2prompt-copy" type="button" onClick={props.onCopy} disabled={props.copyDisabled}>
          {props.copyLabel}
        </button>
        <button className="image2prompt-settings" type="button" onClick={props.onOpenSettings} hidden={props.settingsHidden}>
          去设置
        </button>
      </div>

      <div className="image2prompt-footer">
        <span className="image2prompt-footer-hint">{props.footerHint}</span>
      </div>
    </div>
  );
}
