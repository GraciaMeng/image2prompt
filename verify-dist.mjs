import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const distDir = resolve(projectRoot, "dist");
const manifestPath = resolve(distDir, "manifest.json");

assertExists(distDir, "dist 目录不存在，请先执行 npm run build");
assertExists(manifestPath, "dist/manifest.json 不存在，请先执行 npm run build");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

assert(Array.isArray(manifest.permissions), "manifest.permissions 缺失");
assert(!manifest.permissions.includes("alarms"), "生产 manifest 不应包含 alarms 权限");
assertNoHotUpdateProbe(manifest);

assertManifestFileExists(manifest.background?.service_worker, "缺少 background service worker 产物");
assertManifestFileExists(manifest.options_page, "缺少 options 页面产物");
assertManifestFileExists(manifest.action?.default_popup, "缺少 popup 页面产物");
assertManifestFileExists(manifest.icons?.["128"], "缺少图标产物 icons/icon-128.png");

const contentScripts = Array.isArray(manifest.content_scripts) ? manifest.content_scripts : [];
assert(contentScripts.length > 0, "manifest.content_scripts 缺失");
for (const script of contentScripts) {
  for (const file of script.js ?? []) {
    assertManifestFileExists(file, `缺少 content script 产物 ${file}`);
    assertNoContentScriptModuleSyntax(resolve(distDir, file));
  }
}

console.log("dist 校验通过：manifest、入口文件和图标产物符合发布预期。");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertExists(path, message) {
  assert(existsSync(path), message);
}

function assertManifestFileExists(path, message) {
  assert(typeof path === "string" && path.length > 0, message);
  assertExists(resolve(distDir, path), message);
}

function assertNoHotUpdateProbe(manifest) {
  const resources = manifest.web_accessible_resources ?? [];
  const hasHotUpdate = resources.some((entry) => entry?.resources?.includes("hot-update.json"));
  assert(!hasHotUpdate, "生产 manifest 不应保留 hot-update.json 探针声明");
  assert(!existsSync(resolve(distDir, "hot-update.json")), "生产构建不应产出 hot-update.json");
}

function assertNoContentScriptModuleSyntax(path) {
  const code = readFileSync(path, "utf8");
  assert(
    !/^\s*import\s/m.test(code),
    "content.js 不应包含顶层 import；否则浏览器会按非 module content script 执行失败"
  );
  assert(
    !/^\s*export\s/m.test(code),
    "content.js 不应包含顶层 export；否则浏览器会按非 module content script 执行失败"
  );
}
