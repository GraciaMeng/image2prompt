import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ANALYSIS_LIBRARY_KEY,
  ANALYSIS_RECORDS_LIMIT,
  DEFAULT_ANALYSIS_LIBRARY_STORE,
  SAVED_PRESETS_LIMIT
} from "../../src/shared/constants";
import { addAnalysisRecord, normalizeAnalysisLibraryStore, saveMaterialPreset } from "../../src/shared/storage";
import type { AnalysisRecord, SavedMaterialPreset } from "../../src/shared/types";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizeAnalysisLibraryStore", () => {
  it("falls back to an empty library when storage is missing", () => {
    expect(normalizeAnalysisLibraryStore(undefined)).toEqual(DEFAULT_ANALYSIS_LIBRARY_STORE);
  });

  it("caps records and saved presets to the configured limits", () => {
    const recordIds = Array.from({ length: ANALYSIS_RECORDS_LIMIT + 3 }, (_, index) => `record-${index}`);
    const presetIds = Array.from({ length: SAVED_PRESETS_LIMIT + 2 }, (_, index) => `preset-${index}`);

    const store = normalizeAnalysisLibraryStore({
      updatedAt: "2026-04-25T08:00:00.000Z",
      records: recordIds.map((id, index) => createRecord(id, index)),
      savedPresets: presetIds.map((id, index) => createPreset(id, index))
    });

    expect(store.records).toHaveLength(ANALYSIS_RECORDS_LIMIT);
    expect(store.savedPresets).toHaveLength(SAVED_PRESETS_LIMIT);
    expect(store.records[0]?.id).toBe("record-0");
    expect(store.records.at(-1)?.id).toBe(`record-${ANALYSIS_RECORDS_LIMIT - 1}`);
    expect(store.savedPresets[0]?.id).toBe("preset-0");
    expect(store.savedPresets.at(-1)?.id).toBe(`preset-${SAVED_PRESETS_LIMIT - 1}`);
  });
});

describe("addAnalysisRecord", () => {
  it("stores the newest record first and trims old entries", async () => {
    const existingRecords = Array.from({ length: ANALYSIS_RECORDS_LIMIT }, (_, index) => createRecord(`record-${index}`, index));
    const get = vi.fn().mockResolvedValue({
      [ANALYSIS_LIBRARY_KEY]: {
        ...DEFAULT_ANALYSIS_LIBRARY_STORE,
        records: existingRecords
      }
    });
    const set = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get,
          set
        }
      }
    });

    const newestRecord = createRecord("record-new", 999);
    await addAnalysisRecord(newestRecord);

    expect(get).toHaveBeenCalledWith(ANALYSIS_LIBRARY_KEY);
    expect(set).toHaveBeenCalledTimes(1);

    const savedStore = set.mock.calls[0]?.[0]?.[ANALYSIS_LIBRARY_KEY];
    expect(savedStore.records).toHaveLength(ANALYSIS_RECORDS_LIMIT);
    expect(savedStore.records[0]).toMatchObject({ id: "record-new" });
    expect(savedStore.records.some((item: AnalysisRecord) => item.id === "record-23")).toBe(false);
  });
});

describe("saveMaterialPreset", () => {
  it("stores the newest preset first and trims old entries", async () => {
    const existingPresets = Array.from({ length: SAVED_PRESETS_LIMIT }, (_, index) => createPreset(`preset-${index}`, index));
    const get = vi.fn().mockResolvedValue({
      [ANALYSIS_LIBRARY_KEY]: {
        ...DEFAULT_ANALYSIS_LIBRARY_STORE,
        savedPresets: existingPresets
      }
    });
    const set = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get,
          set
        }
      }
    });

    const newestPreset = createPreset("preset-new", 999);
    await saveMaterialPreset(newestPreset);

    const savedStore = set.mock.calls[0]?.[0]?.[ANALYSIS_LIBRARY_KEY];
    expect(savedStore.savedPresets).toHaveLength(SAVED_PRESETS_LIMIT);
    expect(savedStore.savedPresets[0]).toMatchObject({ id: "preset-new" });
    expect(savedStore.savedPresets.some((item: SavedMaterialPreset) => item.id === "preset-11")).toBe(false);
  });
});

function createRecord(id: string, index: number): AnalysisRecord {
  const timestamp = new Date(Date.UTC(2026, 3, 20, 8, index, 0)).toISOString();

  return {
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
    source: {
      pageUrl: `https://example.com/page-${index}`,
      imageUrl: `https://images.example.com/image-${index}.jpg`,
      pageTitle: `Page ${index}`,
      trigger: "context-menu"
    },
    snapshot: {
      apiKey: "",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4.1-mini",
      systemPrompt: `Prompt ${index}`,
      promptPresetId: "general-recreation",
      modelPresetId: "openai-gpt-4_1-mini"
    },
    outputPrompt: `Output ${index}`,
    notes: undefined,
    tags: [],
    isFavorite: false
  };
}

function createPreset(id: string, index: number): SavedMaterialPreset {
  const timestamp = new Date(Date.UTC(2026, 3, 21, 8, index, 0)).toISOString();

  return {
    id,
    label: `Preset ${index}`,
    description: `Description ${index}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    snapshot: {
      apiKey: "",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4.1-mini",
      systemPrompt: `Prompt ${index}`,
      promptPresetId: "general-recreation",
      modelPresetId: "openai-gpt-4_1-mini"
    }
  };
}
