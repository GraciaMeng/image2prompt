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
      --image2prompt-accent: #56a8ff;
      --image2prompt-accent-strong: #dcecff;
      --image2prompt-accent-ink: #052846;
      --image2prompt-success: #6ec7ab;
      --image2prompt-danger: #ff9da7;
      --image2prompt-border: rgba(132, 170, 214, 0.24);
      --image2prompt-line: rgba(220, 236, 255, 0.1);
      --image2prompt-surface: rgba(7, 16, 28, 0.94);
      --image2prompt-surface-strong: rgba(11, 24, 40, 0.98);
      --image2prompt-surface-soft: rgba(86, 168, 255, 0.09);
      --image2prompt-panel: rgba(255, 255, 255, 0.045);
      --image2prompt-text: #edf5ff;
      --image2prompt-muted: #93a8c3;
      --image2prompt-text-soft: rgba(237, 245, 255, 0.74);
      --image2prompt-ring: rgba(86, 168, 255, 0.24);
      --image2prompt-shadow: 0 24px 60px rgba(2, 8, 16, 0.28);
      font-family: "Avenir Next", "SF Pro Text", "Segoe UI", sans-serif;
      color-scheme: dark;
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
      padding: 16px;
      border-radius: 24px;
      border: 1px solid var(--image2prompt-border);
      background:
        radial-gradient(circle at top right, rgba(86, 168, 255, 0.18), transparent 32%),
        linear-gradient(180deg, var(--image2prompt-surface), var(--image2prompt-surface-strong));
      box-shadow: var(--image2prompt-shadow);
      backdrop-filter: blur(18px);
      color: var(--image2prompt-text);
      overflow: hidden;
    }
    .image2prompt-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 30%),
        radial-gradient(circle at 84% 12%, rgba(195, 227, 255, 0.11), transparent 22%);
      pointer-events: none;
    }
    .image2prompt-card[data-phase="success"] {
      --image2prompt-accent: #6ec7ab;
      --image2prompt-accent-strong: #d5fff0;
      --image2prompt-accent-ink: #093829;
      --image2prompt-ring: rgba(110, 199, 171, 0.24);
    }
    .image2prompt-card[data-phase="error"] {
      --image2prompt-accent: #ff9da7;
      --image2prompt-accent-strong: #ffe0e4;
      --image2prompt-accent-ink: #4b0e19;
      --image2prompt-ring: rgba(255, 157, 167, 0.24);
    }
    .image2prompt-header {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
    }
    .image2prompt-header-main {
      display: grid;
      gap: 10px;
      min-width: 0;
    }
    .image2prompt-title-wrap {
      display: grid;
      gap: 6px;
      min-width: 0;
    }
    .image2prompt-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--image2prompt-accent-strong);
    }
    .image2prompt-header-meta {
      font-size: 13px;
      line-height: 1.5;
      color: var(--image2prompt-text-soft);
    }
    .image2prompt-meta-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .image2prompt-phase-badge,
    .image2prompt-rail-metrics {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      border: 1px solid var(--image2prompt-line);
      background: rgba(255, 255, 255, 0.04);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
    .image2prompt-phase-badge {
      color: var(--image2prompt-accent-strong);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .image2prompt-metric-label {
      font-size: 10px;
      color: var(--image2prompt-muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .image2prompt-metric-value {
      font-size: 11px;
      color: var(--image2prompt-text);
      font-weight: 700;
      line-height: 1;
    }
    .image2prompt-close {
      width: 34px;
      height: 34px;
      border: 1px solid var(--image2prompt-line);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--image2prompt-text);
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      transition:
        background 160ms ease,
        transform 160ms ease,
        border-color 160ms ease;
      flex-shrink: 0;
    }
    .image2prompt-close:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(220, 236, 255, 0.2);
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
      padding: 12px 14px;
      border-radius: 16px;
      border: 1px solid var(--image2prompt-line);
      background: rgba(255, 255, 255, 0.04);
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
      padding: 15px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
      font-size: 12.5px;
      line-height: 1.74;
      min-height: 170px;
      max-height: 320px;
      border-radius: 18px;
      border: 1px solid rgba(132, 170, 214, 0.16);
      background:
        linear-gradient(180deg, rgba(7, 14, 24, 0.82), rgba(10, 20, 34, 0.72)),
        rgba(255, 255, 255, 0.03);
      color: #f4f8ff;
    }
    .image2prompt-content::-webkit-scrollbar {
      width: 10px;
    }
    .image2prompt-content::-webkit-scrollbar-thumb {
      border-radius: 999px;
      background: rgba(220, 236, 255, 0.16);
      border: 2px solid rgba(8, 16, 28, 0.55);
    }
    .image2prompt-actions {
      position: relative;
      z-index: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .image2prompt-copy,
    .image2prompt-retry,
    .image2prompt-settings {
      min-height: 40px;
      border-radius: 14px;
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
      background: linear-gradient(135deg, var(--image2prompt-accent-strong), var(--image2prompt-accent));
      color: var(--image2prompt-accent-ink);
      flex: 1;
    }
    .image2prompt-retry,
    .image2prompt-settings {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--image2prompt-line);
      color: var(--image2prompt-text);
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
      padding: 0 var(--toolbar-padding-inline, 12px) 0 10px;
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      background: rgba(160, 153, 143, 0.96);
      color: rgba(255, 255, 255, 0.96);
      cursor: pointer;
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
      background: rgba(166, 159, 149, 0.98);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
      border-color: rgba(255, 255, 255, 0.36);
    }
    .image2prompt-hover-button.is-primary {
      background: rgba(169, 163, 154, 0.98);
      color: rgba(255, 255, 255, 0.98);
      border-color: rgba(255, 255, 255, 0.34);
    }
    .image2prompt-hover-button.is-primary:hover {
      background: rgba(182, 176, 166, 1);
    }
    .image2prompt-hover-button:disabled {
      opacity: 0.58;
      cursor: wait;
      transform: none;
    }
    .image2prompt-hover-icon-shell {
      width: var(--toolbar-icon-size, 30px);
      height: var(--toolbar-icon-size, 30px);
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
      margin-left: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      flex: 0 1 auto;
    }
    .image2prompt-hover-label {
      position: relative;
      z-index: 1;
      font-size: 13px;
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
        font-size: 13px;
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
