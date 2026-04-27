import type { ExtensionSettings, SettingsValidationErrors } from "../../shared/types";
import { FormField } from "./FormField";

type SettingsFormProps = {
  settings: ExtensionSettings;
  validationErrors: SettingsValidationErrors;
  onChange: <K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) => void;
};

export function SettingsForm({ settings, validationErrors, onChange }: SettingsFormProps) {
  return (
    <div className="settings-form">
      <div className="panel-heading">
        <p className="panel-kicker">模型配置</p>
        <p className="panel-description">
          模型接入改为固定手动配置，不再提供模型预设。分析规则由插件内部统一维护，这里只负责连接信息。
        </p>
      </div>

      <div className="section-note">设置完成后，网页图片上的右键入口和悬浮入口都会直接复用这里的模型配置。</div>

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
