import { createSseEventParser, parseSseEventBlock } from "./stream-parser";

export function runLlmClientSelfTest() {
  const requestId = "self-test";
  const parser = createSseEventParser(requestId);

  assertEqual(
    parseSseEventBlock('data: {"choices":[{"delta":{"content":"hello"}}]}', requestId),
    { type: "STREAM_CHUNK", requestId, chunk: "hello" },
    "single line chunk"
  );

  assertEqual(
    parseSseEventBlock(
      'data: {"choices":[{\ndata: "delta":{"content":"hello"}\ndata: }]}',
      requestId
    ),
    { type: "STREAM_CHUNK", requestId, chunk: "hello" },
    "multi-line data block"
  );

  assertEqual(parseSseEventBlock("data: [DONE]", requestId), { type: "STREAM_DONE", requestId }, "done event");
  assertEqual(parseSseEventBlock("data: {not-json}", requestId), null, "invalid json ignored");

  assertEqual(parser.push('data: {"choices":[{"delta":{"content":"he'), [], "partial chunk buffered");
  assertEqual(
    parser.push('llo"}}]}\n\ndata: [DONE]\n\n'),
    [
      { type: "STREAM_CHUNK", requestId, chunk: "hello" },
      { type: "STREAM_DONE", requestId }
    ],
    "chunked streaming parser"
  );
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);

  if (actualText !== expectedText) {
    throw new Error(`Self test failed for ${label}: expected ${expectedText}, got ${actualText}`);
  }
}
