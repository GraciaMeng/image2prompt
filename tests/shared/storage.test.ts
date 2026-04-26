import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_MODEL_PRESET_ID,
  DEFAULT_PROMPT_PRESET_ID,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  SETTINGS_SCHEMA_VERSION
} from "../../src/shared/constants";
import { addAnalysisRecord, getAnalysisLibraryStore, getSettings, saveSettings } from "../../src/shared/storage";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getSettings", () => {
  it("returns defaults when storage is empty", async () => {
    const get = vi.fn().mockResolvedValue({});
    vi.stubGlobal("chrome", {
      storage: {
        sync: {
          get
        }
      }
    });

    await expect(getSettings()).resolves.toEqual(DEFAULT_SETTINGS);
    expect(get).toHaveBeenCalledWith(SETTINGS_KEY);
  });

  it("merges stored partial settings onto defaults", async () => {
    vi.stubGlobal("chrome", {
      storage: {
        sync: {
          get: vi.fn().mockResolvedValue({
            [SETTINGS_KEY]: {
              apiKey: "sk-test",
              model: "gpt-4.1"
            }
          })
        }
      }
    });

    await expect(getSettings()).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      apiKey: "sk-test",
      model: "gpt-4.1"
    });
  });
});

describe("saveSettings", () => {
  it("persists settings under the shared storage key", async () => {
    const get = vi.fn().mockResolvedValue({});
    const set = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("chrome", {
      storage: {
        sync: {
          get,
          set
        }
      }
    });

    const settings = {
      ...DEFAULT_SETTINGS,
      apiKey: "sk-test"
    };

    await saveSettings(settings);

    expect(get).toHaveBeenCalledWith(SETTINGS_KEY);
    expect(set).toHaveBeenCalledWith({
      [SETTINGS_KEY]: {
        version: SETTINGS_SCHEMA_VERSION,
        settings,
        promptPresetId: DEFAULT_PROMPT_PRESET_ID,
        modelPresetId: DEFAULT_MODEL_PRESET_ID,
        updatedAt: expect.any(String)
      }
    });
  });
});

describe("addAnalysisRecord", () => {
  it("stores the newest analysis record first in local storage", async () => {
    const get = vi.fn().mockResolvedValue({});
    const set = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("chrome", {
      storage: {
        sync: {
          get: vi.fn().mockResolvedValue({})
        },
        local: {
          get,
          set
        }
      }
    });

    await addAnalysisRecord({
      id: "record-1",
      createdAt: "2026-04-25T08:00:00.000Z",
      updatedAt: "2026-04-25T08:00:00.000Z",
      source: {
        pageUrl: "https://example.com/page",
        imageUrl: "https://example.com/image.png",
        pageTitle: "Example",
        trigger: "context-menu"
      },
      snapshot: {
        apiKey: "",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4.1-mini",
        systemPrompt: "test system prompt",
        promptPresetId: "general-recreation",
        modelPresetId: "openai-gpt-4_1-mini"
      },
      outputPrompt: "generated prompt",
      notes: "generated prompt",
      tags: ["example.com"],
      isFavorite: false
    });

    expect(get).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({
      "image2prompt-analysis-library": {
        version: 1,
        records: [
          expect.objectContaining({
            id: "record-1",
            outputPrompt: "generated prompt"
          })
        ],
        savedPresets: [],
        updatedAt: expect.any(String)
      }
    });

    await expect(getAnalysisLibraryStore()).resolves.toEqual({
      version: 1,
      records: [],
      savedPresets: [],
      updatedAt: new Date(0).toISOString()
    });
  });

  it("preserves hover-button as the trigger source", async () => {
    const existingRecord = {
      id: "record-existing",
      createdAt: "2026-04-25T07:00:00.000Z",
      updatedAt: "2026-04-25T07:00:00.000Z",
      source: {
        pageUrl: "https://example.com/older",
        imageUrl: "https://example.com/older.png",
        trigger: "unknown"
      },
      snapshot: DEFAULT_SETTINGS,
      outputPrompt: "older prompt",
      tags: [],
      isFavorite: false
    };
    const get = vi.fn().mockResolvedValue({
      "image2prompt-analysis-library": {
        version: 1,
        records: [existingRecord],
        savedPresets: [],
        updatedAt: "2026-04-25T07:00:00.000Z"
      }
    });
    const set = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("chrome", {
      storage: {
        sync: {
          get: vi.fn().mockResolvedValue({})
        },
        local: {
          get,
          set
        }
      }
    });

    await addAnalysisRecord({
      id: "record-hover",
      createdAt: "2026-04-25T08:00:00.000Z",
      updatedAt: "2026-04-25T08:00:00.000Z",
      source: {
        pageUrl: "https://example.com/page",
        imageUrl: "https://example.com/image.png",
        pageTitle: "Example",
        trigger: "hover-button"
      },
      snapshot: {
        ...DEFAULT_SETTINGS,
        promptPresetId: "general-recreation",
        modelPresetId: "openai-gpt-4_1-mini"
      },
      outputPrompt: "generated prompt",
      tags: ["example.com"],
      isFavorite: false
    });

    expect(set).toHaveBeenCalledWith({
      "image2prompt-analysis-library": expect.objectContaining({
        records: [
          expect.objectContaining({
            id: "record-hover",
            source: expect.objectContaining({
              trigger: "hover-button"
            })
          }),
          expect.objectContaining({
            id: "record-existing"
          })
        ]
      })
    });
  });
});
