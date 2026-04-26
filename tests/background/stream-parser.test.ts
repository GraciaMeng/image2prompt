import { describe, expect, it } from "vitest";

import { createSseEventParser, parseSseEventBlock } from "../../src/background/llm-client/stream-parser";

describe("parseSseEventBlock", () => {
  it("parses chunk events from delta content arrays and ignores non-text parts", () => {
    expect(
      parseSseEventBlock(
        [
          ": keep-alive",
          'data: {"choices":[{"delta":{"content":[',
          'data: {"type":"text","text":"hello "},{"type":"image","text":"ignored"},{"type":"text","text":"world"}',
          "data: ]}}]}",
          ""
        ].join("\n"),
        "req-1"
      )
    ).toEqual({
      type: "STREAM_CHUNK",
      requestId: "req-1",
      chunk: "hello world"
    });
  });

  it("returns stream error and done messages for terminal event blocks", () => {
    expect(
      parseSseEventBlock('data: {"error":{"message":"provider unavailable"}}', "req-2")
    ).toEqual({
      type: "STREAM_ERROR",
      requestId: "req-2",
      error: "provider unavailable"
    });

    expect(parseSseEventBlock("data: [DONE]", "req-2")).toEqual({
      type: "STREAM_DONE",
      requestId: "req-2"
    });
  });

  it("falls back to message content and ignores malformed payloads", () => {
    expect(
      parseSseEventBlock(
        'data: {"choices":[{"message":{"content":"final answer"}}]}',
        "req-3"
      )
    ).toEqual({
      type: "STREAM_CHUNK",
      requestId: "req-3",
      chunk: "final answer"
    });

    expect(parseSseEventBlock("event: message", "req-3")).toBeNull();
    expect(parseSseEventBlock("data: {not-json}", "req-3")).toBeNull();
  });
});

describe("createSseEventParser", () => {
  it("buffers fragmented chunks until a full SSE block is available", () => {
    const parser = createSseEventParser("req-4");

    expect(
      parser.push('data: {"choices":[{"delta":{"content":"hel')
    ).toEqual([]);

    expect(
      parser.push('lo"}}]}\n\ndata: {"choices":[{"delta":{"content":" world"}}]}\n\n')
    ).toEqual([
      {
        type: "STREAM_CHUNK",
        requestId: "req-4",
        chunk: "hello"
      },
      {
        type: "STREAM_CHUNK",
        requestId: "req-4",
        chunk: " world"
      }
    ]);
  });

  it("flushes the final buffered event even without a trailing separator", () => {
    const parser = createSseEventParser("req-5");

    expect(parser.push("data: [DONE]")).toEqual([]);
    expect(parser.flush()).toEqual([
      {
        type: "STREAM_DONE",
        requestId: "req-5"
      }
    ]);
    expect(parser.flush()).toEqual([]);
  });
});
