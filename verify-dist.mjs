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
assert(!("web_accessible_resources" in manifest), "生产 manifest 不应保留 hot-update 资源声明");

assertExists(resolve(distDir, "background.js"), "缺少 background.js");
assertExists(resolve(distDir, "content.js"), "缺少 content.js");
assertExists(resolve(distDir, "index.html"), "缺少 index.html");
assertExists(resolve(distDir, "icons/icon-128.png"), "缺少图标产物 icons/icon-128.png");
assertNoContentScriptModuleSyntax(resolve(distDir, "content.js"));

console.log("dist 校验通过：manifest、入口文件和图标产物符合发布预期。");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertExists(path, message) {
  assert(existsSync(path), message);
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
