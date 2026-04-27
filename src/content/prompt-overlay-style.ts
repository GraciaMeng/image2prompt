import cssText from "./prompt-overlay.css?raw";

const STYLE_ID = "image2prompt-global-style";

export function ensureOverlayStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = cssText;
  document.head.appendChild(style);
}
