import { useEffect, useMemo, useState } from "react";
import { openExtensionOptionsPage } from "../shared/options-page";
import { getAnalysisLibraryStore, getSettingsStore } from "../shared/storage";
import { getSettingsIssues, isSettingsReady } from "../shared/settings-status";
import type { AnalysisLibraryStore, SettingsStore } from "../shared/types";
import "./styles.css";

export function App() {
  const [settingsStore, setSettingsStore] = useState<SettingsStore | null>(null);
  const [library, setLibrary] = useState<AnalysisLibraryStore | null>(null);
  const [status, setStatus] = useState("正在读取配置...");

  useEffect(() => {
    void Promise.all([getSettingsStore(), getAnalysisLibraryStore()])
      .then(([nextSettingsStore, nextLibrary]) => {
        setSettingsStore(nextSettingsStore);
        setLibrary(nextLibrary);
        setStatus("");
      })
      .catch(() => {
        setStatus("读取本地配置失败，请重新打开弹窗。");
      });
  }, []);

  const issues = useMemo(() => {
    if (!settingsStore) {
      return [];
    }

    return getSettingsIssues(settingsStore.settings);
  }, [settingsStore]);

  const latestRecord = library?.records[0];
  const ready = settingsStore ? isSettingsReady(settingsStore.settings) : false;

  const handleOpenSettings = async () => {
    await openExtensionOptionsPage();
    window.close();
  };

  return (
    <main className="popup-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div className="brand-lockup">
            <img className="brand-mark" src="/icons/logo.png" alt="" aria-hidden="true" />
            <p className="eyebrow">Image to Prompt</p>
          </div>
          <span className="hero-chip">Control Panel</span>
        </div>
        <div className="hero-grid">
          <div className="hero-copyblock">
            <h1>{ready ? "扩展已就绪" : "先完成首装设置"}</h1>
            <p className="hero-copy">
              {ready
                ? "现在可以在任意网页图片上右键，或直接点击图片侧悬浮入口，开始分析并提取 Prompt。"
                : "先把 API Key、Base URL 和模型补齐，之后右键图片或使用悬浮入口就能直接拿到可复制的结果。"}
            </p>

            <div className={`status-panel${ready ? " is-ready" : " is-warning"}`}>
              <span className="status-pill">{ready ? "Ready" : `${issues.length} 项待处理`}</span>
              <span className="status-text">
                {status ||
                  (ready
                    ? `当前模型：${settingsStore?.settings.model ?? "未设置"}`
                    : issues[0]?.message ?? "请先打开设置页完成初始化")}
              </span>
            </div>

            <div className="hero-actions">
              <button type="button" onClick={() => void handleOpenSettings()}>
                {ready ? "打开设置页" : "去完成设置"}
              </button>
              <button type="button" className="ghost-button" onClick={() => void handleOpenSettings()}>
                查看历史记录
              </button>
            </div>
          </div>

          <div className="hero-preview" aria-hidden="true">
            <div className="preview-toolbar">
              <span className="preview-button is-primary" data-label="分析">
                ✦
              </span>
              <span className="preview-button" data-label="设置">
                ≡
              </span>
            </div>
            <div className="preview-panel">
              <span className="preview-kicker">Hover Dock</span>
              <strong>悬浮分析入口 + 蓝色控制台</strong>
              <p>设置页已收敛为模型配置和历史记录两块，常用信息更集中，首次上手也更直接。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="section-heading">
          <p className="section-kicker">开始使用</p>
          <h2>第一次上手只要 3 步</h2>
        </div>
        <ol className="step-list">
          <li>点击“{ready ? "打开设置页" : "去完成设置"}”，确认 API Key、Base URL 和模型。</li>
          <li>回到网页，把鼠标移到目标图片上，使用图片侧悬浮入口，或继续右键选择“分析图片并提取 Prompt”。</li>
          <li>等待旁侧结果面板流式返回内容，直接复制；如果配置缺失，面板会给出去设置页入口。</li>
        </ol>
      </section>

      <section className="panel-card">
        <div className="section-heading">
          <p className="section-kicker">当前状态</p>
          <h2>配置与记录</h2>
        </div>

        <div className="fact-grid">
          <article className="fact-card">
            <span className="fact-label">模型</span>
            <strong>{settingsStore?.settings.model || "未设置"}</strong>
          </article>
          <article className="fact-card">
            <span className="fact-label">最近保存</span>
            <strong>{formatDate(settingsStore?.updatedAt)}</strong>
          </article>
          <article className="fact-card">
            <span className="fact-label">分析记录</span>
            <strong>{library?.records.length ?? 0} 条</strong>
          </article>
        </div>

        {issues.length > 0 ? (
          <div className="notice-card">
            <p className="notice-title">当前还不能直接分析</p>
            <ul className="issue-list">
              {issues.map((issue) => (
                <li key={issue.code}>{issue.message}</li>
              ))}
            </ul>
          </div>
        ) : latestRecord ? (
          <div className="notice-card is-success">
            <p className="notice-title">最近一条真实记录</p>
            <p className="notice-copy">{latestRecord.notes || latestRecord.outputPrompt || "已有结果写入历史库。"}</p>
            <p className="notice-meta">
              {formatDate(latestRecord.updatedAt)}
              {" / "}
              {latestRecord.source.pageTitle || safeHostname(latestRecord.source.pageUrl) || "未知来源"}
            </p>
          </div>
        ) : (
          <div className="notice-card">
            <p className="notice-title">还没有真实分析记录</p>
            <p className="notice-copy">完成一次分析后，设置页里的记录面板和这里都会显示真实写入结果。</p>
          </div>
        )}
      </section>
    </main>
  );
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "未保存";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "时间未知";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function safeHostname(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}
