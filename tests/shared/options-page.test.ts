import { describe, expect, it, vi } from "vitest";

import { openExtensionOptionsPage } from "../../src/shared/options-page";

describe("openExtensionOptionsPage", () => {
  it("uses chrome.runtime.openOptionsPage when available", async () => {
    const openOptionsPage = vi.fn().mockResolvedValue(undefined);
    const tabsCreate = vi.fn();

    vi.stubGlobal("chrome", {
      runtime: {
        openOptionsPage,
        getURL: vi.fn()
      },
      tabs: {
        create: tabsCreate
      }
    });

    await openExtensionOptionsPage();

    expect(openOptionsPage).toHaveBeenCalledOnce();
    expect(tabsCreate).not.toHaveBeenCalled();
  });

  it("falls back to tabs.create when runtime.openOptionsPage is unavailable", async () => {
    const tabsCreate = vi.fn().mockResolvedValue(undefined);
    const getURL = vi.fn().mockReturnValue("chrome-extension://test/index.html");

    vi.stubGlobal("chrome", {
      runtime: {
        getURL
      },
      tabs: {
        create: tabsCreate
      }
    });

    await openExtensionOptionsPage();

    expect(getURL).toHaveBeenCalledWith("index.html");
    expect(tabsCreate).toHaveBeenCalledWith({ url: "chrome-extension://test/index.html" });
  });
});
