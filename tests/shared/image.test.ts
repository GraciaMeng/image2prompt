import { describe, expect, it, vi } from "vitest";

import { getImageAnchor, getImageSource, isSameImageUrl } from "../../src/shared/image";

describe("getImageAnchor", () => {
  it("combines element bounds with page scroll offset", () => {
    vi.stubGlobal("window", {
      scrollX: 32,
      scrollY: 128
    });

    const image = {
      getBoundingClientRect: () => ({
        top: 20,
        left: 12,
        width: 640,
        height: 480
      })
    } as HTMLImageElement;

    expect(getImageAnchor(image)).toEqual({
      top: 148,
      left: 44,
      width: 640,
      height: 480
    });
  });
});

describe("isSameImageUrl", () => {
  it("matches against currentSrc first", () => {
    const image = {
      currentSrc: "https://cdn.example.com/final.webp",
      src: "https://cdn.example.com/original.jpg"
    } as HTMLImageElement;

    expect(isSameImageUrl(image, "https://cdn.example.com/final.webp")).toBe(true);
  });

  it("falls back to src when currentSrc is different", () => {
    const image = {
      currentSrc: "https://cdn.example.com/final.webp",
      src: "https://cdn.example.com/original.jpg"
    } as HTMLImageElement;

    expect(isSameImageUrl(image, "https://cdn.example.com/original.jpg")).toBe(true);
    expect(isSameImageUrl(image, "https://cdn.example.com/other.png")).toBe(false);
  });

  it("returns false for a missing image reference", () => {
    expect(isSameImageUrl(null, "https://cdn.example.com/final.webp")).toBe(false);
  });
});

describe("getImageSource", () => {
  it("prefers currentSrc and tolerates nullish values", () => {
    expect(
      getImageSource({
        currentSrc: "https://cdn.example.com/final.webp",
        src: "https://cdn.example.com/original.jpg"
      } as HTMLImageElement)
    ).toBe("https://cdn.example.com/final.webp");

    expect(getImageSource(null)).toBe("");
  });
});
