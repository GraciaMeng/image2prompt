import type { StreamChunkMessage, StreamDoneMessage, StreamErrorMessage } from "../../shared/messages";

type ParsedSsePayload =
  | StreamChunkMessage
  | StreamDoneMessage
  | StreamErrorMessage
  | null;

export type ParsedSseEvent = Exclude<ParsedSsePayload, null>;

type StreamApiPayload = {
  error?: { message?: string };
  choices?: Array<{
    delta?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

type StreamChunkContent =
  | string
  | Array<{ type?: string; text?: string }>
  | undefined;

export function createSseEventParser(requestId: string) {
  let buffer = "";

  return {
    push(chunk: string): ParsedSseEvent[] {
      buffer += chunk;
      return drainBufferedEvents(requestId, false);
    },
    flush(): ParsedSseEvent[] {
      return drainBufferedEvents(requestId, true);
    }
  };

  function drainBufferedEvents(currentRequestId: string, includeRemainder: boolean): ParsedSseEvent[] {
    const normalized = buffer.replace(/\r\n/g, "\n");
    const segments = normalized.split("\n\n");

    if (!includeRemainder) {
      buffer = segments.pop() ?? "";
    } else {
      buffer = "";
    }

    return segments
      .map((segment) => parseSseEventBlock(segment, currentRequestId))
      .filter((event): event is ParsedSseEvent => event !== null);
  }
}

export function parseSseEventBlock(rawBlock: string, requestId: string): ParsedSsePayload {
  const dataLines: string[] = [];

  for (const rawLine of rawBlock.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.startsWith(":")) {
      continue;
    }

    if (rawLine.startsWith("data:")) {
      dataLines.push(rawLine.slice(5).trimStart());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  const data = dataLines.join("\n").trim();
  if (!data) {
    return null;
  }

  if (data === "[DONE]") {
    return {
      type: "STREAM_DONE",
      requestId
    };
  }

  let parsed: StreamApiPayload;
  try {
    parsed = JSON.parse(data) as StreamApiPayload;
  } catch {
    return null;
  }

  if (parsed.error?.message) {
    return {
      type: "STREAM_ERROR",
      requestId,
      error: parsed.error.message
    };
  }

  const chunkContent = parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content;
  const chunk = normalizeChunkContent(chunkContent);
  if (!chunk) {
    return null;
  }

  return {
    type: "STREAM_CHUNK",
    requestId,
    chunk
  };
}

export function parseSseEventData(data: string, requestId: string): ParsedSsePayload {
  const normalized = data.trim();

  if (!normalized) {
    return null;
  }

  if (normalized === "[DONE]") {
    return {
      type: "STREAM_DONE",
      requestId
    };
  }

  let parsed: StreamApiPayload;
  try {
    parsed = JSON.parse(normalized) as StreamApiPayload;
  } catch {
    return null;
  }

  if (parsed.error?.message) {
    return {
      type: "STREAM_ERROR",
      requestId,
      error: parsed.error.message
    };
  }

  const chunkContent = parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content;
  const chunk = normalizeChunkContent(chunkContent);
  if (!chunk) {
    return null;
  }

  return {
    type: "STREAM_CHUNK",
    requestId,
    chunk
  };
}

function normalizeChunkContent(content: StreamChunkContent): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => (part?.type === "text" ? part.text ?? "" : ""))
    .join("");
}
