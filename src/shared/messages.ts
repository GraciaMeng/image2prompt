import type { AnalyzeImagePayload, ImageAnchor } from "./types";

export type StartAnalyzeMessage = {
  type: "START_ANALYZE";
  imageUrl: string;
  anchor: ImageAnchor | null;
};

export type AnalyzeImageMessage = {
  type: "ANALYZE_IMAGE";
  requestId: string;
  payload: AnalyzeImagePayload;
};

export type OpenOptionsPageMessage = {
  type: "OPEN_OPTIONS_PAGE";
};

export type StreamChunkMessage = {
  type: "STREAM_CHUNK";
  requestId: string;
  chunk: string;
};

export type StreamDoneMessage = {
  type: "STREAM_DONE";
  requestId: string;
};

export type StreamErrorMessage = {
  type: "STREAM_ERROR";
  requestId: string;
  error: string;
  code?: "missing-settings" | "request-failed" | "stream-timeout" | "unknown";
  action?: "open-settings";
};

export type StreamStatusMessage = {
  type: "STREAM_STATUS";
  requestId: string;
  status: string;
};

export type DevReloadExtensionMessage = {
  type: "DEV_RELOAD_EXTENSION";
};

export type DevPageReloadMessage = {
  type: "DEV_PAGE_RELOAD";
};

export type ContentMessage =
  | StartAnalyzeMessage
  | StreamStatusMessage
  | StreamChunkMessage
  | StreamDoneMessage
  | StreamErrorMessage
  | DevPageReloadMessage;

export type RuntimeMessage =
  | AnalyzeImageMessage
  | ContentMessage
  | DevReloadExtensionMessage
  | OpenOptionsPageMessage;
