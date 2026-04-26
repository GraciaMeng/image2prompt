import {
  MAX_IMAGE_EDGE,
  MAX_IMAGE_PIXELS,
  MAX_MODEL_IMAGE_BYTES,
  MAX_SOURCE_IMAGE_BYTES,
  MODEL_SUPPORTED_MIME_TYPES
} from "./constants";

type PreparedImage = {
  modelImageUrl: string;
  mimeType: string;
  size: number;
};

export async function prepareModelImage(imageUrl: string): Promise<PreparedImage> {
  const response = await fetchImage(imageUrl);
  const blob = await readImageBlob(response);
  const normalizedBlob = await normalizeImageBlob(blob);

  return {
    modelImageUrl: await blobToDataUrl(normalizedBlob),
    mimeType: normalizedBlob.type,
    size: normalizedBlob.size
  };
}

async function fetchImage(imageUrl: string): Promise<Response> {
  try {
    return await fetch(imageUrl, {
      method: "GET",
      credentials: "omit",
      cache: "force-cache"
    });
  } catch (error) {
    throw new Error(
      `图片下载失败，模型无法读取原图链接。${error instanceof Error ? error.message : "请检查图片地址是否可访问。"}`
    );
  }
}

async function readImageBlob(response: Response): Promise<Blob> {
  if (!response.ok) {
    throw new Error(`图片下载失败: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType && !contentType.startsWith("image/")) {
    throw new Error(`图片地址返回的不是可处理图片，而是 ${contentType}。`);
  }

  const blob = await response.blob();
  if (!blob.size) {
    throw new Error("图片内容为空，无法发送给模型。");
  }

  if (blob.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error(
      `图片原始体积过大（${formatBytes(blob.size)}），已超过 ${formatBytes(MAX_SOURCE_IMAGE_BYTES)} 的处理上限。`
    );
  }

  return blob;
}

async function normalizeImageBlob(blob: Blob): Promise<Blob> {
  const mimeType = blob.type.toLowerCase();

  if (mimeType === "image/svg+xml") {
    throw new Error("暂不支持 SVG 图片，请在网页中选择位图图片后再试。");
  }

  if (MODEL_SUPPORTED_MIME_TYPES.has(mimeType) && blob.size <= MAX_MODEL_IMAGE_BYTES) {
    return blob;
  }

  try {
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;

    if (!width || !height) {
      bitmap.close();
      throw new Error("无法识别图片尺寸。");
    }

    const targetSize = getTargetDimensions(width, height);
    const canvas = new OffscreenCanvas(targetSize.width, targetSize.height);
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      throw new Error("无法创建图片转换画布。");
    }

    // 这里统一在后台兜底缩放和转码，避免超大图片把模型请求直接撑爆。
    context.drawImage(bitmap, 0, 0, targetSize.width, targetSize.height);
    bitmap.close();

    const outputType = getOutputMimeType(mimeType);
    const converted = await canvas.convertToBlob({
      type: outputType,
      quality: outputType === "image/png" ? 0.95 : 0.9
    });

    if (!converted.size) {
      throw new Error("图片转换后内容为空。");
    }

    if (converted.size > MAX_MODEL_IMAGE_BYTES) {
      throw new Error(
        `图片处理后仍然过大（${formatBytes(converted.size)}），请换一张更小的图片再试。`
      );
    }

    return converted;
  } catch (error) {
    throw new Error(
      `图片格式暂不兼容，原始类型为 ${mimeType || "unknown"}。${error instanceof Error ? error.message : ""}`.trim()
    );
  }
}

function getTargetDimensions(width: number, height: number) {
  const edgeScale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
  const pixelScale = Math.min(1, Math.sqrt(MAX_IMAGE_PIXELS / (width * height)));
  const scale = Math.min(edgeScale, pixelScale);

  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale))
  };
}

function getOutputMimeType(sourceMimeType: string): "image/png" | "image/jpeg" | "image/webp" {
  if (sourceMimeType === "image/png" || sourceMimeType === "image/webp") {
    return sourceMimeType;
  }

  return "image/jpeg";
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return `data:${blob.type};base64,${btoa(binary)}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
