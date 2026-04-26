# Image to Prompt Chrome Extension

基于 `React + Vite + TypeScript + Chrome Manifest V3` 的图片转提示词浏览器扩展。

它的核心流程是：在网页图片上触发分析，将图片 URL 与页面上下文发送给兼容 OpenAI `chat/completions` 的多模态模型，再把流式返回的 prompt 以悬浮卡片形式展示在页面侧边。

## 功能概览

- 右键网页图片，或使用图片侧悬浮入口，触发“分析图片并提取 Prompt”
- 在图片附近显示悬浮结果卡片，逐步流式更新内容
- 支持复制结果、失败后重试
- 提供设置页，集中维护 `API Key`、`Base URL`、`Model` 与最近分析记录
- 默认指向 OpenAI 风格接口，可接兼容服务
- 开发模式支持轻量热更新轮询，方便本地调试

## 交付与验收文档

上线前请优先阅读：

- [PRELAUNCH_ACCEPTANCE.md](/Users/mengjiaxi/code/frontend/chrome-extension/image2prompt/PRELAUNCH_ACCEPTANCE.md)
- [CHROME_WEB_STORE_LISTING_DRAFT.md](/Users/mengjiaxi/code/frontend/chrome-extension/image2prompt/CHROME_WEB_STORE_LISTING_DRAFT.md)
- [PRIVACY_POLICY_DRAFT.md](/Users/mengjiaxi/code/frontend/chrome-extension/image2prompt/PRIVACY_POLICY_DRAFT.md)
- [STORE_ASSETS_CHECKLIST.md](/Users/mengjiaxi/code/frontend/chrome-extension/image2prompt/STORE_ASSETS_CHECKLIST.md)

这份文档包含：

- 首装、设置、右键分析、失败重试、权限说明、不同图片格式覆盖的冒烟矩阵
- 建议执行顺序和证据留存方式
- 当前版本上线口径、真实记录写入状态与外部待办边界
- 需要额外准备的外部材料

新增的上架材料草案包含：

- Chrome Web Store 简短描述、详细描述、权限说明、隐私要点与更新说明模板
- 基于当前真实数据流编写的隐私政策草案
- 商店截图与宣传图拍摄清单，便于补齐素材交付

## 安装与运行

### 本地开发

安装依赖：

```bash
npm install
```

或：

```bash
pnpm install
```

启动持续构建：

```bash
npm run dev
```

开发模式会持续监听源码并输出到 `dist/`。此模式会额外生成 `dist/hot-update.json`，用于扩展侧轮询并自动触发重载。

首次加载时，需要在 Chrome 中手动加载一次 `dist/`：

1. 打开 `chrome://extensions`
2. 开启“开发者模式”
3. 选择“加载已解压的扩展程序”
4. 选择当前项目下的 `dist/` 目录

### 生产构建

```bash
npm run build
```

生产构建会输出可打包提交的 `dist/` 目录，并自动移除仅开发模式需要的热更新资源声明。

## 权限说明

当前 `manifest.json` 申请了以下权限：

- `contextMenus`：为网页图片添加右键入口“分析图片并提取 Prompt”
- `storage`：保存用户配置、插件内部分析规则快照和本地分析记录
- `activeTab`：在用户主动触发时读取当前标签页上下文
- `scripting`：向当前页面注入和协同运行扩展逻辑
- `host_permissions: <all_urls>`：允许在用户访问的网站上识别图片、执行右键分析和发送相关页面上下文

补充说明：

- `alarms` 仅用于开发模式下的热更新轮询，生产构建产物中会自动剔除
- 本扩展不会声明不必要的外部跳转、远程代码或自动更新地址

## 隐私与数据流

用户触发图片分析后，数据流大致如下：

1. 用户在网页图片上主动点击右键菜单，或使用图片侧悬浮入口
2. 扩展读取目标图片地址和必要的页面上下文
3. 扩展将图片内容或图片地址相关信息发送给用户配置的多模态接口
4. 接口返回的流式文本结果在页面悬浮卡片中展示
5. 用户配置保存在浏览器扩展存储中

当前实现下的隐私边界：

- `API Key`、`Base URL`、`Model` 以及插件内部维护的分析规则快照保存在本地浏览器扩展存储
- 扩展本身不内置自有服务端，也不会把请求额外转发到项目作者控制的中间服务器
- 实际图片内容、图片 URL、页面上下文会发送到用户自己配置的模型服务提供方
- 数据如何保留、记录或训练，取决于用户所配置的第三方接口服务政策

如果要上架商店，建议在正式隐私政策中明确写清：

- 收集了哪些数据
- 数据发送给谁
- 是否用于身份识别、分析或模型训练
- 用户如何删除或更换本地保存的配置

## 已知限制

- 当前测试主要覆盖共享逻辑，不包含真实 Chrome 环境下的端到端验证
- 扩展依赖外部多模态接口质量，输出 prompt 的稳定性受模型能力、图片质量和内部分析规则影响
- 若目标图片受跨域、懒加载、重定向或站点防护影响，实际可分析结果可能与页面看到的不完全一致
- 热更新机制只面向本地开发，不等同于完整 HMR
- 当前接口兼容层以 OpenAI 风格 `chat/completions` 为中心，未内建多 provider 适配
- 设置页与弹窗中的“最近分析记录”依赖至少一次成功分析；在没有真实数据前会展示空态提示，但成功分析后会自动写回本地历史库

## 发布注意事项

提交 Chrome Web Store 前，至少还需要准备以下材料：

- 商店介绍文案：可参考 [CHROME_WEB_STORE_LISTING_DRAFT.md](/Users/mengjiaxi/code/frontend/chrome-extension/image2prompt/CHROME_WEB_STORE_LISTING_DRAFT.md)
- 商店图形素材：可参考 [STORE_ASSETS_CHECKLIST.md](/Users/mengjiaxi/code/frontend/chrome-extension/image2prompt/STORE_ASSETS_CHECKLIST.md)
- 对外隐私政策页面：可参考 [PRIVACY_POLICY_DRAFT.md](/Users/mengjiaxi/code/frontend/chrome-extension/image2prompt/PRIVACY_POLICY_DRAFT.md) 并发布为可公开访问链接
- 测试记录：至少覆盖几个典型站点、不同图片格式和失败场景

建议发布前自查：

- 使用 `npm run check` 完整执行类型检查、单测和生产构建
- 在一个全新 Chrome Profile 中手动加载 `dist/` 做冒烟测试
- 验证首次安装、配置保存、右键/悬浮入口触发、流式返回、真实记录写入、复制结果和异常提示
- 再次核对权限说明是否与实际行为一致

## 本地验证

常用命令：

```bash
npm run typecheck
npm run test:run
npm run build
npm run verify:dist
```

一键串行校验：

```bash
npm run check
```

说明：

- `typecheck`：只做 TypeScript 类型检查
- `test:run`：运行 `tests/` 下的无头单元测试
- `build`：执行类型检查并产出扩展构建结果
- `verify:dist`：校验生产构建产物是否移除了开发期权限与热更新资源，并检查发布必需文件
- `check`：按“类型检查 -> 单元测试 -> 生产构建 -> 构建产物校验”顺序跑完整校验

## 项目结构

```text
src/
  background/
    context-menu.ts
    llm-client.ts
    main.ts
  content/
    analyze-controller.ts
    image-target-tracker.ts
    prompt-overlay.css.ts
    prompt-overlay.ts
    main.ts
  options/
    components/
    App.tsx
    main.tsx
    styles.css
  shared/
    constants.ts
    dev.ts
    image.ts
    messages.ts
    storage.ts
    types.ts
tests/
  shared/
```

## 接口约定

- 默认请求路径：`POST {baseUrl}/chat/completions`
- 请求体使用多模态 `messages`
- 当前实现依赖服务端支持 `stream: true`

如果未来要切到 OpenAI `Responses API` 或接多家 provider，建议新增 provider 抽象层，而不是继续把协议差异堆进单一路径实现里。
