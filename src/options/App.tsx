import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SETTINGS, MODEL_PRESETS, PROMPT_PRESETS, SETTINGS_SCHEMA_VERSION } from "../shared/constants";
import { getAnalysisLibraryStore, getSettingsStore, saveSettingsStore } from "../shared/storage";
import type { AnalysisLibraryStore, ExtensionSettings, SettingsStore, SettingsValidationErrors } from "../shared/types";
import { LibraryPanel } from "./components/LibraryPanel";
import { SettingsForm } from "./components/SettingsForm";
import "./styles.css";

type ViewId = "settings" | "history";

export function App() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [library, setLibrary] = useState<AnalysisLibraryStore | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [status, setStatus] = useState("正在读取设置...");
  const [isSaving, setIsSaving] = useState(false);
  const [activeView, setActiveView] = useState<ViewId>("settings");

  useEffect(() => {
    void Promise.all([getSettingsStore(), getAnalysisLibraryStore()])
      .then(([store, libraryStore]) => {
        setSettings(store.settings);
        setInitialSettings(store.settings);
        setLibrary(libraryStore);
        setLastSavedAt(store.updatedAt);
        setStatus("");
      })
      .catch(() => {
        setStatus("读取设置失败，请刷新后重试。");
      });
  }, []);

  const updateField = <K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setStatus("");
  };

  const handleSave = async () => {
    const nextSettings: ExtensionSettings = {
      apiKey: settings.apiKey.trim(),
      baseUrl: settings.baseUrl.trim(),
      model: settings.model.trim(),
      systemPrompt: settings.systemPrompt.trim() || DEFAULT_SETTINGS.systemPrompt
    };
    const errors = validateSettings(nextSettings);

    if (hasValidationErrors(errors)) {
      setStatus("请先修正带提示的字段。");
      return;
    }

    setIsSaving(true);
    setStatus("正在保存...");

    const store: SettingsStore = {
      version: SETTINGS_SCHEMA_VERSION,
      settings: nextSettings,
      promptPresetId: getPromptPresetIdByPrompt(nextSettings.systemPrompt),
      modelPresetId: getModelPresetIdBySettings(nextSettings),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveSettingsStore(store);
      setSettings(nextSettings);
      setInitialSettings(nextSettings);
      setLastSavedAt(store.updatedAt);
      setStatus("模型配置已保存。");
      window.setTimeout(() => {
        setStatus((current) => (current === "模型配置已保存。" ? "" : current));
      }, 2400);
    } catch {
      setStatus("保存失败，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  };

  const validationErrors = useMemo(() => validateSettings(settings), [settings]);
  const isDirty = useMemo(() => !isSameSettings(settings, initialSettings), [initialSettings, settings]);
  const historyCount = library?.records.length ?? 0;

  return (
    <main className="page-shell">
      <div className="workspace-layout">
        <aside className="workspace-sidebar" aria-label="设置菜单">
          <div className="sidebar-brand">
            <img className="sidebar-brand-mark" src="/icons/logo.png" alt="" aria-hidden="true" />
            <span className="sidebar-brand-name">Image to Prompt</span>
          </div>

          <nav className="side-nav">
            <div className="side-nav-group">
              <button
                type="button"
                className={`side-nav-item${activeView === "settings" ? " is-active" : ""}`}
                onClick={() => setActiveView("settings")}
              >
                <span className="side-nav-icon side-nav-icon-home" aria-hidden="true" />
                <span className="side-nav-copy">
                  <span className="side-nav-label">模型配置</span>
                </span>
                {isDirty ? <span className="side-nav-badge">●</span> : null}
              </button>
              <button
                type="button"
                className={`side-nav-item${activeView === "history" ? " is-active" : ""}`}
                onClick={() => setActiveView("history")}
              >
                <span className="side-nav-icon side-nav-icon-file" aria-hidden="true" />
                <span className="side-nav-copy">
                  <span className="side-nav-label">历史记录</span>
                </span>
                <span className="side-nav-badge">{library?.records.length ?? 0}</span>
              </button>
            </div>
          </nav>
        </aside>

        <section className="workspace-panel">
          <div className="panel-topbar" aria-live="polite">
            <span className={`panel-status${isDirty ? " is-dirty" : ""}`}>{isDirty ? "未保存修改" : "已同步"}</span>
            <span className="panel-status-copy">{status || `最近保存：${formatTimestamp(lastSavedAt)}`}</span>
          </div>
          {activeView === "settings" ? (
            <>
              <SettingsForm settings={settings} validationErrors={validationErrors} onChange={updateField} />
              <div className="panel-actions">
                <button type="button" onClick={handleSave} disabled={isSaving || !isDirty}>
                  {isSaving ? "保存中..." : isDirty ? "保存模型配置" : "已保存"}
                </button>
                <p className="panel-footnote">保存到浏览器同步存储，右键与悬浮入口会直接复用当前模型配置。</p>
              </div>
            </>
          ) : (
            <LibraryPanel library={library} />
          )}
        </section>
      </div>
    </main>
  );
}

function validateSettings(settings: ExtensionSettings): SettingsValidationErrors {
  const errors: SettingsValidationErrors = {};

  if (!settings.apiKey.trim()) {
    errors.apiKey = "API Key 不能为空，否则插件无法向模型发起请求。";
  }

  const normalizedBaseUrl = settings.baseUrl.trim();
  if (!normalizedBaseUrl) {
    errors.baseUrl = "Base URL 不能为空。";
  } else {
    try {
      const parsedUrl = new URL(normalizedBaseUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        errors.baseUrl = "Base URL 必须是 http 或 https 地址。";
      }
    } catch {
      errors.baseUrl = "Base URL 格式不正确，请填写完整 URL。";
    }
  }

  if (!settings.model.trim()) {
    errors.model = "Model 不能为空。";
  }

  return errors;
}

function hasValidationErrors(errors: SettingsValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

function isSameSettings(a: ExtensionSettings, b: ExtensionSettings): boolean {
  return (
    a.apiKey === b.apiKey &&
    a.baseUrl === b.baseUrl &&
    a.model === b.model &&
    a.systemPrompt === b.systemPrompt
  );
}

function getPromptPresetIdByPrompt(systemPrompt: string): string {
  return PROMPT_PRESETS.find((preset) => preset.systemPrompt === systemPrompt)?.id ?? "custom";
}

function getModelPresetIdBySettings(settings: Pick<ExtensionSettings, "baseUrl" | "model">): string {
  return (
    MODEL_PRESETS.find(
      (preset) => preset.baseUrl === settings.baseUrl.trim() && preset.model === settings.model.trim()
    )?.id ?? "custom"
  );
}

function formatTimestamp(value: string): string {
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
