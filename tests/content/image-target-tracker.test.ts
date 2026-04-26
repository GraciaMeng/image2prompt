import { describe, expect, it } from "vitest";

import { getVisibleImageRect, isHoverEligibleImageRect } from "../../src/content/image-target-tracker";

describe("isHoverEligibleImageRect", () => {
  it("accepts images that are large enough for the hover entry", () => {
    expect(isHoverEligibleImageRect({ width: 240, height: 120 })).toBe(true);
  });

  it("rejects images that are too narrow or too short", () => {
    expect(isHoverEligibleImageRect({ width: 95, height: 180 })).toBe(false);
    expect(isHoverEligibleImageRect({ width: 180, height: 95 })).toBe(false);
  });

  it("rejects images whose visible area is still too small", () => {
    expect(isHoverEligibleImageRect({ width: 120, height: 120 })).toBe(false);
  });
});

describe("getVisibleImageRect", () => {
  it("clips the image bounds to the current visual viewport", () => {
    Object.defineProperty(globalThis, "window", {
      value: {
        innerWidth: 1280,
        innerHeight: 720,
        visualViewport: {
          offsetTop: 80,
          offsetLeft: 0,
          width: 1280,
          height: 640
        }
      },
      configurable: true
    });

    const image = {
      getBoundingClientRect: () => ({
        top: 20,
        left: 100,
        right: 500,
        bottom: 420,
        width: 400,
        height: 400
      })
    } as HTMLImageElement;

    expect(getVisibleImageRect(image)).toEqual({
      top: 80,
      left: 100,
      right: 500,
      bottom: 420,
      width: 400,
      height: 340
    });
  });

  it("returns null when the image is fully outside the viewport", () => {
    Object.defineProperty(globalThis, "window", {
      value: {
        innerWidth: 1280,
        innerHeight: 720,
        visualViewport: {
          offsetTop: 0,
          offsetLeft: 0,
          width: 1280,
          height: 720
        }
      },
      configurable: true
    });

    const image = {
      getBoundingClientRect: () => ({
        top: -300,
        left: 100,
        right: 500,
        bottom: -20,
        width: 400,
        height: 280
      })
    } as HTMLImageElement;

    expect(getVisibleImageRect(image)).toBeNull();
  });
});
