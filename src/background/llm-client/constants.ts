export const MODEL_SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

export const FIRST_CHUNK_TIMEOUT_MS = 20000;
export const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_MODEL_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_EDGE = 4096;
export const MAX_IMAGE_PIXELS = 16_000_000;
