import {
  ANALYSIS_LIBRARY_KEY,
  ANALYSIS_LIBRARY_SCHEMA_VERSION,
  ANALYSIS_RECORDS_LIMIT,
  DEFAULT_MODEL_PRESET_ID,
  DEFAULT_ANALYSIS_LIBRARY_STORE,
  DEFAULT_PROMPT_PRESET_ID,
  DEFAULT_SETTINGS,
  DEFAULT_SETTINGS_STORE,
  MODEL_PRESETS,
  PROMPT_PRESETS,
  SAVED_PRESETS_LIMIT,
  SETTINGS_KEY,
  SETTINGS_SCHEMA_VERSION
} from "./constants";
import type {
  AnalysisLibraryStore,
  AnalysisRecord,
  ExtensionSettings,
  SavedMaterialPreset,
  SettingsStore,
  StoredAnalysisLibraryShape,
  StoredSettingsShape
} from "./types";

export async function getSettings(): Promise<ExtensionSettings> {
  const store = await getSettingsStore();
  return store.settings;
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  const currentStore = await getSettingsStore();
  const normalizedSettings = normalizeSettings(settings);

  await saveSettingsStore({
    ...currentStore,
    settings: normalizedSettings,
    promptPresetId: getMatchingPromptPresetId(normalizedSettings.systemPrompt),
    modelPresetId: getMatchingModelPresetId(normalizedSettings.baseUrl, normalizedSettings.model),
    updatedAt: new Date().toISOString()
  });
}

export async function getSettingsStore(): Promise<SettingsStore> {
  const result = await chrome.storage.sync.get(SETTINGS_KEY);
  return normalizeStoredSettings(result[SETTINGS_KEY] as StoredSettingsShape);
}

export async function saveSettingsStore(store: SettingsStore): Promise<void> {
  const normalizedStore = normalizeStore(store);
  await chrome.storage.sync.set({ [SETTINGS_KEY]: normalizedStore });
}

export async function getAnalysisLibraryStore(): Promise<AnalysisLibraryStore> {
  const result = await chrome.storage.local.get(ANALYSIS_LIBRARY_KEY);
  return normalizeAnalysisLibraryStore(result[ANALYSIS_LIBRARY_KEY] as StoredAnalysisLibraryShape);
}

export async function saveAnalysisLibraryStore(store: AnalysisLibraryStore): Promise<void> {
  const normalizedStore = normalizeAnalysisLibraryStore(store);
  await chrome.storage.local.set({ [ANALYSIS_LIBRARY_KEY]: normalizedStore });
}

export async function addAnalysisRecord(record: AnalysisRecord): Promise<void> {
  const store = await getAnalysisLibraryStore();
  const records = [record, ...store.records.filter((item) => item.id !== record.id)].slice(0, ANALYSIS_RECORDS_LIMIT);

  await saveAnalysisLibraryStore({
    ...store,
    records,
    updatedAt: new Date().toISOString()
  });
}

export async function saveMaterialPreset(preset: SavedMaterialPreset): Promise<void> {
  const store = await getAnalysisLibraryStore();
  const savedPresets = [preset, ...store.savedPresets.filter((item) => item.id !== preset.id)].slice(
    0,
    SAVED_PRESETS_LIMIT
  );

  await saveAnalysisLibraryStore({
    ...store,
    savedPresets,
    updatedAt: new Date().toISOString()
  });
}

export function normalizeStoredSettings(input: StoredSettingsShape): SettingsStore {
  if (isStoreShape(input)) {
    return normalizeStore(input);
  }

  const legacySettings = normalizeSettings(input);
  return normalizeStore({
    ...DEFAULT_SETTINGS_STORE,
    settings: legacySettings,
    promptPresetId: getMatchingPromptPresetId(legacySettings.systemPrompt),
    modelPresetId: getMatchingModelPresetId(legacySettings.baseUrl, legacySettings.model)
  });
}

export function normalizeAnalysisLibraryStore(input: StoredAnalysisLibraryShape): AnalysisLibraryStore {
  const records = Array.isArray(input?.records) ? input.records.map(normalizeAnalysisRecord).slice(0, ANALYSIS_RECORDS_LIMIT) : [];
  const savedPresets = Array.isArray(input?.savedPresets)
    ? input.savedPresets.map(normalizeSavedMaterialPreset).slice(0, SAVED_PRESETS_LIMIT)
    : [];

  return {
    version: ANALYSIS_LIBRARY_SCHEMA_VERSION,
    records,
    savedPresets,
    updatedAt: typeof input?.updatedAt === "string" && input.updatedAt ? input.updatedAt : new Date(0).toISOString()
  };
}

export function normalizeSettings(input: Partial<ExtensionSettings> | undefined): ExtensionSettings {
  return {
    apiKey: typeof input?.apiKey === "string" ? input.apiKey.trim() : DEFAULT_SETTINGS.apiKey,
    baseUrl: normalizeBaseUrl(input?.baseUrl),
    model: typeof input?.model === "string" && input.model.trim() ? input.model.trim() : DEFAULT_SETTINGS.model,
    systemPrompt:
      typeof input?.systemPrompt === "string" && input.systemPrompt.trim()
        ? input.systemPrompt.trim()
        : DEFAULT_SETTINGS.systemPrompt
  };
}

function normalizeStore(input: Partial<SettingsStore>): SettingsStore {
  const settings = normalizeSettings(input.settings);

  return {
    version: SETTINGS_SCHEMA_VERSION,
    settings,
    promptPresetId: isKnownPromptPresetId(input.promptPresetId)
      ? input.promptPresetId
      : getMatchingPromptPresetId(settings.systemPrompt),
    modelPresetId: isKnownModelPresetId(input.modelPresetId)
      ? input.modelPresetId
      : getMatchingModelPresetId(settings.baseUrl, settings.model),
    updatedAt: typeof input.updatedAt === "string" && input.updatedAt ? input.updatedAt : new Date().toISOString()
  };
}

function normalizeAnalysisRecord(input: Partial<AnalysisRecord>): AnalysisRecord {
  const createdAt = normalizeIsoString(input.createdAt);
  const updatedAt = normalizeIsoString(input.updatedAt, createdAt);
  const snapshot = normalizeSettings(input.snapshot);

  return {
    id: typeof input.id === "string" && input.id ? input.id : crypto.randomUUID(),
    createdAt,
    updatedAt,
    source: {
      pageUrl: typeof input.source?.pageUrl === "string" ? input.source.pageUrl : "",
      imageUrl: typeof input.source?.imageUrl === "string" ? input.source.imageUrl : "",
      pageTitle: typeof input.source?.pageTitle === "string" && input.source.pageTitle ? input.source.pageTitle : undefined,
      trigger: normalizeTrigger(input.source?.trigger)
    },
    snapshot: {
      ...snapshot,
      promptPresetId: typeof input.snapshot?.promptPresetId === "string" ? input.snapshot.promptPresetId : undefined,
      modelPresetId: typeof input.snapshot?.modelPresetId === "string" ? input.snapshot.modelPresetId : undefined
    },
    outputPrompt: typeof input.outputPrompt === "string" ? input.outputPrompt.trim() : "",
    notes: typeof input.notes === "string" && input.notes.trim() ? input.notes.trim() : undefined,
    tags: Array.isArray(input.tags)
      ? input.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0).slice(0, 8)
      : [],
    isFavorite: Boolean(input.isFavorite)
  };
}

function normalizeSavedMaterialPreset(input: Partial<SavedMaterialPreset>): SavedMaterialPreset {
  const createdAt = normalizeIsoString(input.createdAt);
  const updatedAt = normalizeIsoString(input.updatedAt, createdAt);

  return {
    id: typeof input.id === "string" && input.id ? input.id : crypto.randomUUID(),
    label: typeof input.label === "string" && input.label.trim() ? input.label.trim() : "未命名沉淀配置",
    description:
      typeof input.description === "string" && input.description.trim()
        ? input.description.trim()
        : "由设置页保存的模型与提示词快照。",
    createdAt,
    updatedAt,
    snapshot: {
      ...normalizeSettings(input.snapshot),
      promptPresetId: typeof input.snapshot?.promptPresetId === "string" ? input.snapshot.promptPresetId : undefined,
      modelPresetId: typeof input.snapshot?.modelPresetId === "string" ? input.snapshot.modelPresetId : undefined
    }
  };
}

function normalizeBaseUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return DEFAULT_SETTINGS.baseUrl;
  }

  return value.trim().replace(/\/+$/, "");
}

function normalizeIsoString(value: unknown, fallback = new Date(0).toISOString()): string {
  if (typeof value !== "string" || !value) {
    return fallback;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function normalizeTrigger(value: unknown): AnalysisRecord["source"]["trigger"] {
  if (value === "context-menu" || value === "hover-button" || value === "options-preview" || value === "unknown") {
    return value;
  }

  return "unknown";
}

function getMatchingPromptPresetId(systemPrompt: string): string {
  return PROMPT_PRESETS.find((preset) => preset.systemPrompt === systemPrompt)?.id ?? DEFAULT_PROMPT_PRESET_ID;
}

function getMatchingModelPresetId(baseUrl: string, model: string): string {
  return (
    MODEL_PRESETS.find((preset) => preset.baseUrl === baseUrl && preset.model === model)?.id ??
    DEFAULT_MODEL_PRESET_ID
  );
}

function isKnownPromptPresetId(value: unknown): value is string {
  return typeof value === "string" && PROMPT_PRESETS.some((preset) => preset.id === value);
}

function isKnownModelPresetId(value: unknown): value is string {
  return typeof value === "string" && MODEL_PRESETS.some((preset) => preset.id === value);
}

function isStoreShape(value: StoredSettingsShape): value is Partial<SettingsStore> {
  return Boolean(value) && typeof value === "object" && "settings" in value;
}
