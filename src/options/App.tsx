import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_MODEL_PRESET_ID,
  DEFAULT_SETTINGS,
  MODEL_PRESETS,
  PROMPT_PRESETS,
  SETTINGS_SCHEMA_VERSION
} from "../shared/constants";
import { getAnalysisLibraryStore, getSettingsStore, saveSettingsStore } from "../shared/storage";
import type { AnalysisLibraryStore, ExtensionSettings, SettingsStore, SettingsValidationErrors } from "../shared/types";
import { LibraryPanel } from "./components/LibraryPanel";
import { SettingsForm } from "./components/SettingsForm";
import "./styles.css";

export function App() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [modelPresetId, setModelPresetId] = useState(DEFAULT_MODEL_PRESET_ID);
  const [library, setLibrary] = useState<AnalysisLibraryStore | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [status, setStatus] = useState("正在读取设置...");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void Promise.all([getSettingsStore(), getAnalysisLibraryStore()])
      .then(([store, libraryStore]) => {
        setSettings(store.settings);
        setInitialSettings(store.settings);
        setModelPresetId(store.modelPresetId);
        setLibrary(libraryStore);
        setLastSavedAt(store.updatedAt);
        setStatus("");
      })
      .catch(() => {
        setStatus("读取设置失败，请刷新后重试。");
      });
  }, []);

  const updateField = <K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) => {
    setSettings((current) => {
      const nextSettings = { ...current, [key]: value };
      if (key === "baseUrl" || key === "model") {
        setModelPresetId(getModelPresetIdBySettings(nextSettings));
      }

      return nextSettings;
    });
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
      setModelPresetId(store.modelPresetId);
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
  const currentModelPresetLabel = getPresetLabel(modelPresetId);

  return (
    <main className="page-shell">
      <header className="page-header">
        <div className="page-heading">
          <div className="brand-lockup">
            <img className="brand-mark" src="/icons/logo.png" alt="" aria-hidden="true" />
            <p className="eyebrow">Image to Prompt</p>
          </div>
          <h1>模型配置与历史记录</h1>
          <p className="intro">
            设置页只保留真正需要维护的两块内容。系统分析规则已改为插件内部统一管理，这里只负责模型接入与结果回看。
          </p>
        </div>

        <div className="header-meta" aria-label="当前设置摘要">
          <span className="meta-chip">当前预设：{currentModelPresetLabel}</span>
          <span className="meta-chip">最近保存：{formatTimestamp(lastSavedAt)}</span>
        </div>
      </header>

      <section className="status-strip" aria-live="polite">
        <span className={`status-badge${isDirty ? " is-dirty" : " is-ready"}`}>
          {isDirty ? "未保存修改" : "已同步"}
        </span>
        <span className="status-copy">
          {status ||
            (isDirty
              ? "保存后会立即覆盖当前浏览器内的模型配置。"
              : "当前页只管理模型接入与历史记录。")}
        </span>
      </section>

      <div className="workspace-grid">
        <section className="workspace-panel">
          <SettingsForm
            settings={settings}
            validationErrors={validationErrors}
            disablePresetActions={isSaving}
            onChange={updateField}
            onApplyModelPreset={(presetId) => {
              const preset = MODEL_PRESETS.find((item) => item.id === presetId);
              if (!preset) {
                return;
              }

              setSettings((current) => ({
                ...current,
                baseUrl: preset.baseUrl,
                model: preset.model
              }));
              setModelPresetId(preset.id);
              setStatus(`已应用模型预设：${preset.label}。API Key 保持不变，请确认后保存。`);
            }}
            onResetModel={() => {
              const preset = MODEL_PRESETS.find((item) => item.id === DEFAULT_MODEL_PRESET_ID);
              if (!preset) {
                return;
              }

              setSettings((current) => ({
                ...current,
                baseUrl: preset.baseUrl,
                model: preset.model
              }));
              setModelPresetId(preset.id);
              setStatus("已恢复默认模型预设，请确认后保存。");
            }}
          />

          <div className="panel-actions">
            <button type="button" onClick={handleSave} disabled={isSaving || !isDirty}>
              {isSaving ? "保存中..." : isDirty ? "保存模型配置" : "已保存"}
            </button>
            <p className="panel-footnote">
              当前模型预设：{currentModelPresetLabel}
              {" · "}
              保存到浏览器同步存储
            </p>
          </div>
        </section>

        <section className="workspace-panel">
          <LibraryPanel library={library} />
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

function getPresetLabel(presetId: string): string {
  return MODEL_PRESETS.find((preset) => preset.id === presetId)?.label ?? "自定义";
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
