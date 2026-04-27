const STYLE_ID = "image2prompt-global-style";

export function ensureOverlayStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .image2prompt-layer,
    .image2prompt-hover-toolbar {
      --image2prompt-accent: #111111;
      --image2prompt-accent-strong: #f4f4f2;
      --image2prompt-accent-ink: #ffffff;
      --image2prompt-success: #2d7d5c;
      --image2prompt-danger: #b44b52;
      --image2prompt-border: rgba(15, 18, 22, 0.12);
      --image2prompt-line: rgba(15, 18, 22, 0.08);
      --image2prompt-surface: rgba(255, 255, 255, 0.98);
      --image2prompt-surface-strong: rgba(250, 250, 248, 0.98);
      --image2prompt-surface-soft: rgba(17, 17, 17, 0.04);
      --image2prompt-panel: rgba(17, 17, 17, 0.03);
      --image2prompt-text: #111111;
      --image2prompt-muted: #777777;
      --image2prompt-text-soft: #666666;
      --image2prompt-ring: rgba(17, 17, 17, 0.12);
      --image2prompt-shadow: 0 20px 48px rgba(0, 0, 0, 0.14);
      font-family: "Inter", "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif;
      color-scheme: light;
    }
    .image2prompt-layer {
      position: fixed;
      z-index: 2147483647;
      width: 348px;
      max-width: min(348px, calc(100vw - 24px));
      max-height: min(560px, calc(100vh - 24px));
      animation: image2prompt-fade-in 220ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .image2prompt-card {
      position: relative;
      display: grid;
      gap: 12px;
      min-height: 300px;
      padding: 18px 16px 16px;
      border-radius: 28px;
      border: 1px solid var(--image2prompt-border);
      background: linear-gradient(180deg, var(--image2prompt-surface), var(--image2prompt-surface-strong));
      box-shadow: var(--image2prompt-shadow);
      backdrop-filter: blur(22px);
      color: var(--image2prompt-text);
      overflow: hidden;
    }
    .image2prompt-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0)),
        radial-gradient(circle at 86% 8%, rgba(17, 17, 17, 0.04), transparent 26%);
      pointer-events: none;
    }
    .image2prompt-card[data-phase="success"] {
      --image2prompt-accent: #0f7a50;
      --image2prompt-accent-strong: #e7f6ef;
      --image2prompt-accent-ink: #ffffff;
      --image2prompt-ring: rgba(15, 122, 80, 0.16);
    }
    .image2prompt-card[data-phase="error"] {
      --image2prompt-accent: #b44b52;
      --image2prompt-accent-strong: #fbebec;
      --image2prompt-accent-ink: #ffffff;
      --image2prompt-ring: rgba(180, 75, 82, 0.16);
    }
    .image2prompt-header {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: start;
    }
    .image2prompt-title-wrap {
      display: grid;
      gap: 8px;
      min-width: 0;
    }
    .image2prompt-title {
      font-size: 20px;
      line-height: 1.1;
      letter-spacing: -0.03em;
      font-weight: 800;
      color: var(--image2prompt-text);
    }
    .image2prompt-header-meta {
      font-size: 13px;
      line-height: 1.55;
      color: var(--image2prompt-text-soft);
    }
    .image2prompt-close {
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(17, 17, 17, 0.08);
      border-radius: 999px;
      background: rgba(17, 17, 17, 0.03);
      color: var(--image2prompt-text);
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      padding: 0;
      transition:
        background 160ms ease,
        transform 160ms ease,
        border-color 160ms ease;
      flex-shrink: 0;
    }
    .image2prompt-close:hover {
      background: rgba(17, 17, 17, 0.06);
      border-color: rgba(17, 17, 17, 0.12);
      transform: translateY(-1px);
    }
    .image2prompt-close:focus-visible,
    .image2prompt-copy:focus-visible,
    .image2prompt-retry:focus-visible,
    .image2prompt-settings:focus-visible,
    .image2prompt-hover-button:focus-visible {
      outline: none;
      box-shadow: 0 0 0 4px var(--image2prompt-ring);
    }
    .image2prompt-status {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 18px;
      border: 1px solid rgba(17, 17, 17, 0.07);
      background: rgba(17, 17, 17, 0.025);
      font-size: 12px;
      color: var(--image2prompt-text);
    }
    .image2prompt-status-text {
      flex: 1;
      min-width: 0;
      line-height: 1.55;
    }
    .image2prompt-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--image2prompt-accent);
      box-shadow: 0 0 0 0 rgba(86, 168, 255, 0.3);
      animation: image2prompt-pulse 1.25s infinite;
      flex-shrink: 0;
    }
    .image2prompt-card[data-phase="success"] .image2prompt-dot,
    .image2prompt-card[data-phase="error"] .image2prompt-dot {
      animation: none;
    }
    .image2prompt-trust-note {
      position: relative;
      z-index: 1;
      font-size: 12px;
      line-height: 1.55;
      color: var(--image2prompt-muted);
    }
    .image2prompt-content {
      position: relative;
      z-index: 1;
      margin: 0;
      padding: 16px 18px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: "SF Mono", "SFMono-Regular", Consolas, monospace;
      font-size: 13px;
      line-height: 1.78;
      min-height: 230px;
      max-height: 330px;
      border-radius: 22px;
      border: 1px solid rgba(17, 17, 17, 0.08);
      background: #fafaf9;
      color: #161616;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
    }
    .image2prompt-content.is-code {
      background: #f5f6f7;
    }
    .image2prompt-content::-webkit-scrollbar {
      width: 10px;
    }
    .image2prompt-content::-webkit-scrollbar-thumb {
      border-radius: 999px;
      background: rgba(17, 17, 17, 0.14);
      border: 2px solid rgba(250, 250, 249, 0.82);
    }
    .image2prompt-actions {
      position: relative;
      z-index: 1;
      display: flex;
      flex-wrap: nowrap;
      gap: 10px;
    }
    .image2prompt-copy,
    .image2prompt-retry,
    .image2prompt-settings {
      min-height: 42px;
      border-radius: 16px;
      padding: 10px 14px;
      border: 1px solid transparent;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition:
        transform 160ms ease,
        opacity 160ms ease,
        background 160ms ease,
        border-color 160ms ease;
    }
    .image2prompt-copy:hover,
    .image2prompt-retry:hover,
    .image2prompt-settings:hover {
      transform: translateY(-1px);
    }
    .image2prompt-copy {
      flex: 1 1 0;
      background: linear-gradient(180deg, #151515, #050505);
      color: #ffffff;
    }
    .image2prompt-settings {
      background: #ffffff;
      border-color: rgba(17, 17, 17, 0.1);
      color: var(--image2prompt-text);
      flex: 1 1 0;
    }
    .image2prompt-copy:disabled,
    .image2prompt-retry:disabled,
    .image2prompt-settings:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
    }
    .image2prompt-footer {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--image2prompt-muted);
    }
    .image2prompt-footer-hint {
      min-width: 0;
      color: var(--image2prompt-text-soft);
    }
    .image2prompt-hover-toolbar {
      position: fixed;
      z-index: 2147483646;
      display: grid;
      gap: var(--toolbar-gap, 8px);
      justify-items: end;
      width: fit-content;
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
      animation: image2prompt-fade-in 180ms cubic-bezier(0.22, 1, 0.36, 1);
      pointer-events: auto;
      overflow: visible;
    }
    .image2prompt-hover-toolbar[hidden] {
      display: none !important;
    }
    .image2prompt-hover-button {
      appearance: none;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: fit-content;
      justify-self: end;
      min-height: var(--toolbar-button-height, 46px);
      padding: 0 var(--toolbar-padding-inline, 12px) 0 8px;
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 16px;
      background: rgba(160, 153, 143, 0.72);
      color: rgba(255, 255, 255, 0.96);
      cursor: pointer;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition:
        transform 160ms ease,
        background 160ms ease,
        opacity 160ms ease,
        box-shadow 160ms ease,
        border-color 160ms ease;
      text-align: left;
      overflow: visible;
      white-space: nowrap;
    }
    .image2prompt-hover-button:hover {
      transform: translateY(-1px);
      background: rgba(166, 159, 149, 0.8);
      box-shadow: 0 10px 18px rgba(0, 0, 0, 0.12);
      border-color: rgba(255, 255, 255, 0.3);
    }
    .image2prompt-hover-button.is-primary {
      background: rgba(169, 163, 154, 0.8);
      color: rgba(255, 255, 255, 0.98);
      border-color: rgba(255, 255, 255, 0.28);
    }
    .image2prompt-hover-button.is-primary:hover {
      background: rgba(182, 176, 166, 0.86);
    }
    .image2prompt-hover-button:disabled {
      opacity: 0.58;
      cursor: wait;
      transform: none;
    }
    .image2prompt-hover-icon-shell {
      width: calc(var(--toolbar-icon-size, 30px) + 2px);
      height: calc(var(--toolbar-icon-size, 30px) + 2px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0;
      background: transparent;
      flex-shrink: 0;
    }
    .image2prompt-hover-button.is-primary .image2prompt-hover-icon-shell {
      background: transparent;
    }
    .image2prompt-hover-icon {
      width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .image2prompt-hover-icon svg {
      width: 100%;
      height: 100%;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .image2prompt-hover-text-wrap {
      position: relative;
      min-width: 0;
      margin-left: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      flex: 0 1 auto;
    }
    .image2prompt-hover-label {
      position: relative;
      z-index: 1;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.01em;
      line-height: 1;
      white-space: nowrap;
      color: rgba(255, 255, 255, 0.96);
    }
    .image2prompt-hover-label.is-short,
    .image2prompt-hover-label.is-full {
      display: none;
    }
    .image2prompt-hover-tooltip {
      display: none;
      position: absolute;
      top: 50%;
      right: calc(100% + 8px);
      transform: translateY(-50%) translateX(4px) scale(0.98);
      transform-origin: right center;
      pointer-events: none;
      white-space: nowrap;
      padding: 6px 8px;
      border-radius: 999px;
      background: rgba(119, 113, 106, 0.96);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
      color: rgba(255, 255, 255, 0.96);
      font-size: 11px;
      line-height: 1;
      opacity: 0;
      transition:
        opacity 140ms ease,
        transform 140ms ease;
    }
    .image2prompt-hover-button:hover .image2prompt-hover-tooltip,
    .image2prompt-hover-button:focus-visible .image2prompt-hover-tooltip {
      opacity: 1;
      transform: translateY(-50%) translateX(0) scale(1);
    }
    .image2prompt-hover-toolbar[data-mode="large"] .image2prompt-hover-label.is-full {
      display: inline;
    }
    .image2prompt-hover-toolbar[data-mode="medium"] .image2prompt-hover-label.is-short {
      display: inline;
    }
    .image2prompt-hover-toolbar[data-mode="small"] .image2prompt-hover-text-wrap {
      display: none;
    }
    .image2prompt-hover-toolbar[data-mode="small"] .image2prompt-hover-tooltip {
      display: inline-flex;
      opacity: 0;
    }
    .image2prompt-hover-toolbar[data-mode="small"] .image2prompt-hover-button:hover .image2prompt-hover-tooltip,
    .image2prompt-hover-toolbar[data-mode="small"] .image2prompt-hover-button:focus-visible .image2prompt-hover-tooltip {
      opacity: 1;
    }
    .image2prompt-hover-toolbar[data-mode="small"] .image2prompt-hover-label {
      display: none;
    }
    @media (max-width: 640px) {
      .image2prompt-layer {
        width: min(348px, calc(100vw - 16px));
        max-width: calc(100vw - 16px);
        max-height: calc(100vh - 16px);
      }
      .image2prompt-card {
        padding: 14px;
        border-radius: 20px;
      }
      .image2prompt-content {
        max-height: min(280px, 42vh);
      }
      .image2prompt-hover-toolbar {
        border-radius: 0;
      }
      .image2prompt-hover-button {
        border-radius: 14px;
      }
      .image2prompt-hover-icon-shell {
        background: transparent;
      }
      .image2prompt-hover-label {
        font-size: 12px;
      }
    }
    @keyframes image2prompt-fade-in {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.985);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @keyframes image2prompt-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(86, 168, 255, 0.28);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(86, 168, 255, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(86, 168, 255, 0);
      }
    }
  `;

  document.head.appendChild(style);
}
