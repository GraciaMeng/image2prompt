import { addAnalysisRecord, getSettingsStore } from "../shared/storage";
import { getSettingsIssues } from "../shared/settings-status";
import type {
  AnalyzeImageMessage,
  ContentMessage,
  RuntimeMessage,
  StreamErrorMessage,
  StreamStatusMessage
} from "../shared/messages";
import { FIRST_CHUNK_TIMEOUT_MS } from "./llm-client/constants";
import { prepareModelImage } from "./llm-client/image-prepare";
import { buildAnalysisRequestBody, getChatCompletionsUrl } from "./llm-client/provider-request";
import { createSseEventParser, type ParsedSseEvent } from "./llm-client/stream-parser";

export function registerAnalysisHandler() {
  chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender) => {
    if (message.type !== "ANALYZE_IMAGE") {
      return false;
    }

    const tabId = sender.tab?.id;
    if (!tabId) {
      return false;
    }

    void streamAnalysis(tabId, message);
    return false;
  });
}

async function streamAnalysis(tabId: number, message: AnalyzeImageMessage) {
  const settingsStore = await getSettingsStore();
  const settings = settingsStore.settings;
  let emittedAnyChunk = false;
  let finalOutput = "";
  let firstChunkTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

  const issues = getSettingsIssues(settings);
  if (issues.length > 0) {
    await emitToTab(tabId, {
      type: "STREAM_ERROR",
      requestId: message.requestId,
      error: `请先完成插件设置：${issues.map((issue) => issue.message.replace(/。$/, "")).join("；")}。`,
      code: "missing-settings",
      action: "open-settings"
    });
    return;
  }

  try {
    await emitStatus(tabId, message.requestId, "正在预处理图片...");
    const preparedImage = await prepareModelImage(message.payload.imageUrl);
    await emitStatus(
      tabId,
      message.requestId,
      `图片已处理（${preparedImage.mimeType}，${formatBytes(preparedImage.size)}），正在提交给大模型...`
    );

    const response = await fetch(getChatCompletionsUrl(settings.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify(buildAnalysisRequestBody(settings, message, preparedImage.modelImageUrl))
    });

    if (!response.ok || !response.body) {
      throw new Error(await getErrorMessage(response));
    }

    await emitStatus(tabId, message.requestId, "请求已发出，等待模型返回...");
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    const parser = createSseEventParser(message.requestId);
    firstChunkTimer = globalThis.setTimeout(() => {
      void emitToTab(tabId, {
        type: "STREAM_ERROR",
        requestId: message.requestId,
        error: "等待模型返回超时。请求可能未被当前网关正确处理，或该模型不支持图片流式分析。",
        code: "stream-timeout"
      });
    }, FIRST_CHUNK_TIMEOUT_MS);

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const events = parser.push(decoder.decode(value, { stream: true }));
      const shouldStop = await emitParsedEvents(events);
      if (shouldStop) {
        break;
      }
    }

    const trailingEvents = parser.flush();
    await emitParsedEvents(trailingEvents);
    if (firstChunkTimer !== null) {
      clearTimeout(firstChunkTimer);
    }

    if (!emittedAnyChunk) {
      throw new Error("模型未返回可用内容，请检查模型是否支持图片分析和流式输出。");
    }

    await addAnalysisRecord({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: {
        pageUrl: message.payload.pageUrl,
        imageUrl: message.payload.imageUrl,
        pageTitle: message.payload.pageTitle,
        trigger: message.payload.trigger ?? "unknown"
      },
      snapshot: {
        apiKey: "",
        baseUrl: settings.baseUrl,
        model: settings.model,
        systemPrompt: settings.systemPrompt,
        promptPresetId: settingsStore.promptPresetId,
        modelPresetId: settingsStore.modelPresetId
      },
      outputPrompt: finalOutput.trim(),
      notes: summarizeOutput(finalOutput),
      tags: buildRecordTags(message.payload.pageUrl, settingsStore.promptPresetId),
      isFavorite: false
    });

    await emitToTab(tabId, {
      type: "STREAM_DONE",
      requestId: message.requestId
    });
  } catch (error) {
    await emitToTab(tabId, buildStreamErrorMessage(message.requestId, error));
  }

  async function emitParsedEvents(events: ParsedSseEvent[]): Promise<boolean> {
    for (const event of events) {
      // 首个文本分片是体验上的关键拐点，用它来切换状态文案和超时保护。
      if (event.type === "STREAM_CHUNK") {
        if (firstChunkTimer !== null) {
          clearTimeout(firstChunkTimer);
          firstChunkTimer = null;
        }
        emittedAnyChunk = true;
        finalOutput += event.chunk;
        await emitStatus(tabId, message.requestId, "正在生成提示词...");
      }

      if (event.type === "STREAM_DONE") {
        return true;
      }

      await emitToTab(tabId, event);
    }

    return false;
  }
}

function buildStreamErrorMessage(requestId: string, error: unknown): StreamErrorMessage {
  const message = error instanceof Error ? error.message : "分析失败";

  if (message.includes("超时")) {
    return {
      type: "STREAM_ERROR",
      requestId,
      error: message,
      code: "stream-timeout"
    };
  }

  return {
    type: "STREAM_ERROR",
    requestId,
    error: message,
    code: "request-failed"
  };
}

function summarizeOutput(output: string): string | undefined {
  const normalized = output.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.length > 160 ? `${normalized.slice(0, 157)}...` : normalized;
}

function buildRecordTags(pageUrl: string, promptPresetId: string): string[] {
  const tags = new Set<string>();

  if (promptPresetId && promptPresetId !== "custom") {
    tags.add(promptPresetId);
  }

  try {
    const hostname = new URL(pageUrl).hostname.replace(/^www\./, "");
    if (hostname) {
      tags.add(hostname);
    }
  } catch {
    // Ignore malformed page URLs and keep the stored record usable.
  }

  return Array.from(tags).slice(0, 8);
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string } };
    if (data.error?.message) {
      return data.error.message;
    }
  } catch {
    return `请求失败: ${response.status} ${response.statusText}`;
  }

  return `请求失败: ${response.status} ${response.statusText}`;
}

async function emitToTab(tabId: number, message: ContentMessage) {
  await chrome.tabs.sendMessage(tabId, message);
}

async function emitStatus(tabId: number, requestId: string, status: string) {
  const message: StreamStatusMessage = {
    type: "STREAM_STATUS",
    requestId,
    status
  };
  await emitToTab(tabId, message);
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
