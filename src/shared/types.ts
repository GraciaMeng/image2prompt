export type ExtensionSettings = {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
};

export type SettingsSnapshot = ExtensionSettings;

export type SettingsPresetKind = "prompt" | "model";

export type PromptPreset = {
  id: string;
  label: string;
  description: string;
  systemPrompt: string;
  recommendedModel?: string;
};

export type ModelPreset = {
  id: string;
  label: string;
  description: string;
  baseUrl: string;
  model: string;
};

export type SettingsValidationErrors = Partial<Record<keyof ExtensionSettings, string>>;

export type SettingsStore = {
  version: 2;
  settings: ExtensionSettings;
  promptPresetId: string;
  modelPresetId: string;
  updatedAt: string;
};

export type AnalysisRecordSource = {
  pageUrl: string;
  imageUrl: string;
  pageTitle?: string;
  trigger?: "context-menu" | "hover-button" | "options-preview" | "unknown";
};

export type AnalysisRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: AnalysisRecordSource;
  snapshot: SettingsSnapshot & {
    promptPresetId?: string;
    modelPresetId?: string;
  };
  outputPrompt: string;
  notes?: string;
  tags: string[];
  isFavorite: boolean;
};

export type SavedMaterialPreset = {
  id: string;
  label: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  snapshot: SettingsSnapshot & {
    promptPresetId?: string;
    modelPresetId?: string;
  };
};

export type AnalysisLibraryStore = {
  version: 1;
  records: AnalysisRecord[];
  savedPresets: SavedMaterialPreset[];
  updatedAt: string;
};

export type StoredAnalysisLibraryShape = Partial<AnalysisLibraryStore> | undefined;

export type LegacySettingsShape = Partial<ExtensionSettings>;

export type StoredSettingsShape = Partial<SettingsStore> | LegacySettingsShape | undefined;

export type ImageAnchor = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type AnalyzeImagePayload = {
  imageUrl: string;
  pageUrl: string;
  pageTitle?: string;
  trigger?: "context-menu" | "hover-button" | "options-preview" | "unknown";
};
