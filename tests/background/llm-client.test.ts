import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AnalyzeImageMessage, RuntimeMessage } from "../../src/shared/messages";

const addAnalysisRecord = vi.fn().mockResolvedValue(undefined);
const getSettingsStore = vi.fn().mockResolvedValue({
  settings: {
    apiKey: "test-key",
    baseUrl: "https://api.example.com/v1",
    model: "test-model",
    systemPrompt: "system prompt"
  },
  promptPresetId: "preset-1",
  modelPresetId: "model-1",
  updatedAt: "2026-04-25T00:00:00.000Z",
  version: 2
});
const getSettingsIssues = vi.fn().mockReturnValue([]);
const prepareModelImage = vi.fn().mockResolvedValue({
  mimeType: "image/png",
  size: 1024,
  modelImageUrl: "data:image/png;base64,abc"
});
const buildAnalysisRequestBody = vi.fn().mockReturnValue({ stream: true });
const getChatCompletionsUrl = vi.fn().mockReturnValue("https://api.example.com/v1/chat/completions");

vi.mock("../../src/shared/storage", () => ({
  addAnalysisRecord,
  getSettingsStore
}));

vi.mock("../../src/shared/settings-status", () => ({
  getSettingsIssues
}));

vi.mock("../../src/background/llm-client/image-prepare", () => ({
  prepareModelImage
}));

vi.mock("../../src/background/llm-client/provider-request", () => ({
  buildAnalysisRequestBody,
  getChatCompletionsUrl
}));

describe("registerAnalysisHandler", () => {
  let listener: ((message: RuntimeMessage, sender: chrome.runtime.MessageSender) => boolean) | undefined;
  let sendMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    listener = undefined;
    sendMessage = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal("chrome", {
      runtime: {
        onMessage: {
          addListener: vi.fn((callback: typeof listener) => {
            listener = callback;
          })
        }
      },
      tabs: {
        sendMessage
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("persists the analysis record before emitting done when the stream finishes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        body: createSseResponseBody([
          'data: {"choices":[{"delta":{"content":"prompt body"}}]}\n\n',
          "data: [DONE]\n\n"
        ])
      })
    );

    const { registerAnalysisHandler } = await import("../../src/background/llm-client");
    registerAnalysisHandler();

    const message = createAnalyzeImageMessage();
    listener?.(message, { tab: { id: 7 } } as chrome.runtime.MessageSender);
    await waitForAsyncWork();

    expect(addAnalysisRecord).toHaveBeenCalledTimes(1);
    expect(addAnalysisRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        outputPrompt: "prompt body",
        source: expect.objectContaining({
          pageUrl: message.payload.pageUrl,
          imageUrl: message.payload.imageUrl
        })
      })
    );

    const doneMessage = sendMessage.mock.calls.find(([, contentMessage]) => contentMessage.type === "STREAM_DONE");
    expect(doneMessage).toBeDefined();
    const doneCallIndex = sendMessage.mock.calls.findIndex(([, contentMessage]) => contentMessage.type === "STREAM_DONE");
    expect(doneCallIndex).toBeGreaterThanOrEqual(0);
    expect(addAnalysisRecord.mock.invocationCallOrder[0]).toBeLessThan(
      sendMessage.mock.invocationCallOrder[doneCallIndex] ?? Infinity
    );
  });
});

function createAnalyzeImageMessage(): AnalyzeImageMessage {
  return {
    type: "ANALYZE_IMAGE",
    requestId: "req-1",
    payload: {
      imageUrl: "https://images.example.com/example.png",
      pageUrl: "https://example.com/post",
      pageTitle: "Example",
      trigger: "context-menu"
    }
  };
}

function createSseResponseBody(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    }
  });
}

async function waitForAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}
