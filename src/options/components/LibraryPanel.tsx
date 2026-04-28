import { useMemo, useRef, useState } from "react";
import type { AnalysisLibraryStore, AnalysisRecord } from "../../shared/types";

type LibraryPanelProps = {
  library: AnalysisLibraryStore | null;
};

export function LibraryPanel({ library }: LibraryPanelProps) {
  const [toast, setToast] = useState("");
  const toastTimerRef = useRef<number | null>(null);
  const records = useMemo(() => library?.records.slice(0, 8) ?? [], [library]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast("");
      toastTimerRef.current = null;
    }, 2200);
  };

  const handleCopy = async (record: AnalysisRecord) => {
    try {
      await navigator.clipboard.writeText(record.outputPrompt);
      showToast(`已复制 ${getRecordTitle(record)} 的分析结果。`);
    } catch {
      showToast("复制失败，请稍后重试。");
    }
  };

  return (
    <div className="history-panel">
      <div className="panel-header">
        <div className="panel-heading">
          <h2 className="panel-title">历史记录</h2>
          <p className="panel-description">这里会展示真实分析记录，方便回看来源页面、模型信息和最近结果。</p>
        </div>
        <div className="history-count">{library ? `${library.records.length} 条` : "读取中"}</div>
      </div>

      {toast ? (
        <div className="toast-message" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}

      {!library ? (
        <div className="empty-state">
          <p>正在读取历史记录...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <p>暂无历史记录。</p>
        </div>
      ) : (
        <div className="record-list">
          {records.map((record) => (
            <article key={record.id} className="record-item">
              <div className="record-header">
                <div className="record-main">
                  <p className="record-title">{getRecordTitle(record)}</p>
                  <p className="record-meta">
                    <span>{formatDate(record.updatedAt)}</span>
                    <span>{record.snapshot.model || "未记录模型"}</span>
                    <span>{getTriggerLabel(record)}</span>
                  </p>
                </div>

                <div className="record-actions">
                  <button
                    type="button"
                    className="ghost-button subtle-button"
                    onClick={() => void handleCopy(record)}
                    disabled={!record.outputPrompt}
                  >
                    复制结果
                  </button>
                </div>
              </div>

              <p className="record-prompt">{record.outputPrompt || "本条记录尚未保存结果文本。"}</p>
              {record.notes ? <p className="record-note">{record.notes}</p> : null}

              {record.tags.length > 0 ? (
                <div className="tag-row">
                  {record.tags.map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function getRecordTitle(record: AnalysisRecord): string {
  return record.source.pageTitle || safeHostname(record.source.pageUrl) || "未命名来源";
}

function safeHostname(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

function formatDate(value: string): string {
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

function getTriggerLabel(record: AnalysisRecord): string {
  if (record.source.trigger === "hover-button") {
    return "悬浮入口";
  }

  if (record.source.trigger === "context-menu") {
    return "右键菜单";
  }

  return "其他来源";
}
