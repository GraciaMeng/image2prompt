import { MODEL_PRESETS } from "../../shared/constants";
import type { ExtensionSettings, SettingsValidationErrors } from "../../shared/types";
import { FormField } from "./FormField";

type SettingsFormProps = {
  settings: ExtensionSettings;
  validationErrors: SettingsValidationErrors;
  disablePresetActions?: boolean;
  onChange: <K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) => void;
  onApplyModelPreset: (presetId: string) => void;
  onResetModel: () => void;
};

export function SettingsForm({
  settings,
  validationErrors,
  disablePresetActions,
  onChange,
  onApplyModelPreset,
  onResetModel
}: SettingsFormProps) {
  return (
    <div className="settings-form">
      <div className="panel-heading">
        <p className="panel-kicker">模型配置</p>
        <h2>连接到你的推理服务</h2>
        <p className="panel-description">
          建议先选一个可靠的模型预设，再补齐 API Key。分析规则由插件内部统一维护，这里只负责模型接入。
        </p>
      </div>

      <div className="section-note">设置完成后，网页图片上的右键入口和悬浮入口都会直接复用这里的模型配置。</div>

      <FormField
        label="模型预设"
        description="快速填入常用接口与模型组合。应用预设不会覆盖你已填写的 API Key。"
        actions={
          <button type="button" className="ghost-button subtle-button" onClick={onResetModel} disabled={disablePresetActions}>
            恢复默认
          </button>
        }
      >
        <div className="preset-grid">
          {MODEL_PRESETS.map((preset) => {
            const active = preset.baseUrl === settings.baseUrl && preset.model === settings.model;
            return (
              <button
                key={preset.id}
                type="button"
                className={`preset-card${active ? " is-active" : ""}`}
                onClick={() => onApplyModelPreset(preset.id)}
                disabled={disablePresetActions}
              >
                <span className="preset-title">{preset.label}</span>
                <span className="preset-description">{preset.description}</span>
                <span className="preset-meta">
                  {preset.baseUrl}
                  {" / "}
                  {preset.model}
                </span>
              </button>
            );
          })}
        </div>
      </FormField>

      <FormField
        label="API Key"
        description="用于向你的大模型网关发起请求。保存在浏览器同步存储中，建议只填写具备最小权限的密钥。"
        error={validationErrors.apiKey}
        hint="常见格式如 sk-...；如果使用自建网关，请填写该网关要求的 Bearer Token。"
      >
        <input
          type="password"
          value={settings.apiKey}
          onChange={(event) => onChange("apiKey", event.target.value)}
          placeholder="sk-..."
          autoComplete="off"
          spellCheck={false}
        />
      </FormField>

      <FormField
        label="Base URL"
        description="填写到接口根路径即可，保存时会自动去掉末尾斜杠。"
        error={validationErrors.baseUrl}
        hint="例如 https://api.openai.com/v1"
      >
        <input
          type="url"
          value={settings.baseUrl}
          onChange={(event) => onChange("baseUrl", event.target.value)}
          placeholder="https://api.openai.com/v1"
          autoComplete="off"
          spellCheck={false}
        />
      </FormField>

      <FormField
        label="Model"
        description="这里填写实际请求体中的 model 名称。不同网关可能要求不同值。"
        error={validationErrors.model}
        hint="例如 gpt-4.1-mini、gpt-4.1，或你的 OpenAI-compatible 服务支持的视觉模型。"
      >
        <input
          type="text"
          value={settings.model}
          onChange={(event) => onChange("model", event.target.value)}
          placeholder="gpt-4.1-mini"
          autoComplete="off"
          spellCheck={false}
        />
      </FormField>
    </div>
  );
}
