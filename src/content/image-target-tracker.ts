import { getImageAnchor, getImageSource as getResolvedImageSource, isSameImageUrl } from "../shared/image";
import type { ImageAnchor } from "../shared/types";

let lastContextTarget: HTMLImageElement | null = null;
const MIN_HOVER_IMAGE_WIDTH = 96;
const MIN_HOVER_IMAGE_HEIGHT = 96;
const MIN_HOVER_IMAGE_AREA = 18_000;

export type VisibleImageRect = Pick<DOMRectReadOnly, "top" | "left" | "right" | "bottom" | "width" | "height">;

export function startTrackingContextImage() {
  document.addEventListener(
    "contextmenu",
    (event) => {
      const image = findImageFromEvent(event);
      if (image) {
        lastContextTarget = image;
      }
    },
    true
  );
}

export function resolveImageTarget(imageUrl: string, anchor: ImageAnchor | null): HTMLImageElement | null {
  if (lastContextTarget && isSameImageUrl(lastContextTarget, imageUrl)) {
    return lastContextTarget;
  }

  const images = Array.from(document.images);

  if (anchor) {
    const nearestByAnchor = images
      .map((img) => ({ img, score: distance(getImageAnchor(img), anchor) }))
      .sort((a, b) => a.score - b.score)[0]?.img;

    if (nearestByAnchor && isSameImageUrl(nearestByAnchor, imageUrl)) {
      return nearestByAnchor;
    }
  }

  return (
    images.find((img) => isSameImageUrl(img, imageUrl)) ??
    null
  );
}

export function findHoverTargetAtPoint(clientX: number, clientY: number): HTMLImageElement | null {
  return findImageFromNodes(document.elementsFromPoint(clientX, clientY), true);
}

export function isHoverEligibleImageRect(rect: Pick<DOMRectReadOnly, "width" | "height">): boolean {
  if (rect.width < MIN_HOVER_IMAGE_WIDTH || rect.height < MIN_HOVER_IMAGE_HEIGHT) {
    return false;
  }

  return rect.width * rect.height >= MIN_HOVER_IMAGE_AREA;
}

export function isHoverEligibleImage(image: HTMLImageElement): boolean {
  if (!image.isConnected || !getImageSource(image)) {
    return false;
  }

  const visibleRect = getVisibleImageRect(image);
  if (!visibleRect) {
    return false;
  }

  return isHoverEligibleImageRect(visibleRect);
}

export function getVisibleImageRect(image: HTMLImageElement): VisibleImageRect | null {
  const rect = image.getBoundingClientRect();
  const viewport = getViewportBounds();
  const top = Math.max(rect.top, viewport.top);
  const left = Math.max(rect.left, viewport.left);
  const right = Math.min(rect.right, viewport.right);
  const bottom = Math.min(rect.bottom, viewport.bottom);
  const width = right - left;
  const height = bottom - top;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return {
    top,
    left,
    right,
    bottom,
    width,
    height
  };
}

function findImageFromEvent(event: MouseEvent): HTMLImageElement | null {
  return findImageFromNodes(event.composedPath(), false);
}

function distance(a: ImageAnchor, b: ImageAnchor): number {
  const dx = a.left - b.left;
  const dy = a.top - b.top;
  const dw = a.width - b.width;
  const dh = a.height - b.height;
  return Math.abs(dx) + Math.abs(dy) + Math.abs(dw) + Math.abs(dh);
}

function findImageFromNodes(nodes: Iterable<EventTarget | Element>, requireHoverEligible: boolean): HTMLImageElement | null {
  for (const node of nodes) {
    if (node instanceof HTMLImageElement && matchesImageRequirement(node, requireHoverEligible)) {
      return node;
    }

    if (node instanceof HTMLElement) {
      const nestedImage = Array.from(node.querySelectorAll("img")).find((image) =>
        matchesImageRequirement(image, requireHoverEligible)
      );
      if (nestedImage) {
        return nestedImage;
      }
    }
  }

  return null;
}

function matchesImageRequirement(image: HTMLImageElement, requireHoverEligible: boolean): boolean {
  if (!getImageSource(image)) {
    return false;
  }

  return requireHoverEligible ? isHoverEligibleImage(image) : true;
}

function getImageSource(image: HTMLImageElement): string {
  return getResolvedImageSource(image);
}

function getViewportBounds() {
  const top = window.visualViewport?.offsetTop ?? 0;
  const left = window.visualViewport?.offsetLeft ?? 0;
  const width = window.visualViewport?.width ?? window.innerWidth;
  const height = window.visualViewport?.height ?? window.innerHeight;

  return {
    top,
    left,
    right: left + width,
    bottom: top + height
  };
}
