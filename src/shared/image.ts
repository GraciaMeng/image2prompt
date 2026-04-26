import type { ImageAnchor } from "./types";

export function getImageAnchor(image: HTMLImageElement): ImageAnchor {
  const rect = image.getBoundingClientRect();
  return {
    top: window.scrollY + rect.top,
    left: window.scrollX + rect.left,
    width: rect.width,
    height: rect.height
  };
}

export function getImageSource(image: Pick<HTMLImageElement, "currentSrc" | "src"> | null | undefined): string {
  return image?.currentSrc || image?.src || "";
}

export function isSameImageUrl(img: Pick<HTMLImageElement, "currentSrc" | "src"> | null | undefined, imageUrl: string): boolean {
  if (!img) {
    return false;
  }

  return img.currentSrc === imageUrl || img.src === imageUrl;
}
