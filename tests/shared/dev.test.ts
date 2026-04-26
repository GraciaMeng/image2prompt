import { afterEach, describe, expect, it, vi } from "vitest";

import { DEV_HOT_FILE, readHotUpdatePayload } from "../../src/shared/dev";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("readHotUpdatePayload", () => {
  it("requests the hot update payload without cache and returns parsed JSON", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-25T10:00:00.000Z"));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ buildId: "build-123" })
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("chrome", {
      runtime: {
        getURL: vi.fn().mockReturnValue(`chrome-extension://test/${DEV_HOT_FILE}`)
      }
    });

    await expect(readHotUpdatePayload()).resolves.toEqual({ buildId: "build-123" });
    expect(fetchMock).toHaveBeenCalledWith(
      "chrome-extension://test/hot-update.json?t=1777111200000",
      { cache: "no-store" }
    );
  });

  it("returns null when the request fails or the payload is unavailable", async () => {
    vi.stubGlobal("chrome", {
      runtime: {
        getURL: vi.fn().mockReturnValue(`chrome-extension://test/${DEV_HOT_FILE}`)
      }
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(readHotUpdatePayload()).resolves.toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    await expect(readHotUpdatePayload()).resolves.toBeNull();
  });
});
