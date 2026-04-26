import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "../../src/shared/constants";
import { getSettingsIssues, isSettingsReady } from "../../src/shared/settings-status";

describe("getSettingsIssues", () => {
  it("returns an issue for each missing user-managed field", () => {
    expect(
      getSettingsIssues({
        apiKey: "",
        baseUrl: "",
        model: "",
        systemPrompt: ""
      }).map((issue) => issue.code)
    ).toEqual(["missing-api-key", "missing-base-url", "missing-model"]);
  });

  it("does not block readiness on the hidden system prompt", () => {
    expect(
      getSettingsIssues({
        ...DEFAULT_SETTINGS,
        apiKey: "sk-test",
        systemPrompt: ""
      })
    ).toEqual([]);
  });

  it("reports ready when all required settings exist", () => {
    expect(getSettingsIssues({ ...DEFAULT_SETTINGS, apiKey: "sk-test" })).toEqual([]);
    expect(isSettingsReady({ ...DEFAULT_SETTINGS, apiKey: "sk-test" })).toBe(true);
  });
});
