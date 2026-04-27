import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Image to Prompt",
  short_name: "Img2Prompt",
  description: "右键网页图片或使用悬浮入口，调用你配置的大模型生成可复用的 AI 绘图提示词。",
  version: "0.0.1",
  permissions: ["contextMenus", "storage", "activeTab", "scripting"],
  host_permissions: ["<all_urls>"],
  background: {
    service_worker: "src/background/main.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/main.tsx"],
      run_at: "document_idle"
    }
  ],
  options_page: "index.html",
  action: {
    default_title: "Image to Prompt",
    default_popup: "popup.html",
    default_icon: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png"
    }
  },
  icons: {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
});
