import type { ExtensionSettings } from "./types";

export type SettingsIssueCode = "missing-api-key" | "missing-base-url" | "missing-model";

export type SettingsIssue = {
  code: SettingsIssueCode;
  field: keyof ExtensionSettings;
  message: string;
};

export function getSettingsIssues(settings: ExtensionSettings): SettingsIssue[] {
  const issues: SettingsIssue[] = [];

  if (!settings.apiKey.trim()) {
    issues.push({
      code: "missing-api-key",
      field: "apiKey",
      message: "还没有填写 API Key，插件暂时无法向模型发请求。"
    });
  }

  if (!settings.baseUrl.trim()) {
    issues.push({
      code: "missing-base-url",
      field: "baseUrl",
      message: "还没有填写 Base URL。"
    });
  }

  if (!settings.model.trim()) {
    issues.push({
      code: "missing-model",
      field: "model",
      message: "还没有填写模型名称。"
    });
  }

  return issues;
}

export function isSettingsReady(settings: ExtensionSettings): boolean {
  return getSettingsIssues(settings).length === 0;
}
