import { describe, expect, it } from "vitest";

import { buildAnalysisRequestBody, getChatCompletionsUrl } from "../../src/background/llm-client/provider-request";

describe("getChatCompletionsUrl", () => {
  it("normalizes a trailing slash before appending the endpoint", () => {
    expect(getChatCompletionsUrl("https://api.openai.com/v1/")).toBe("https://api.openai.com/v1/chat/completions");
    expect(getChatCompletionsUrl("https://api.openai.com/v1")).toBe("https://api.openai.com/v1/chat/completions");
  });
});

describe("buildAnalysisRequestBody", () => {
  it("builds a multimodal streaming payload with page context", () => {
    const request = buildAnalysisRequestBody(
      {
        apiKey: "sk-test",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4.1-mini",
        systemPrompt: "Return only the final prompt."
      },
      {
        type: "ANALYZE_IMAGE",
        requestId: "req-1",
        payload: {
          imageUrl: "https://images.example.com/photo.jpg",
          pageUrl: "https://example.com/gallery"
        }
      },
      "data:image/jpeg;base64,abc123"
    );

    expect(request).toEqual({
      model: "gpt-4.1-mini",
      stream: true,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: "Return only the final prompt."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请分析这张图片并提取最终 prompt。当前网页：https://example.com/gallery"
            },
            {
              type: "image_url",
              image_url: {
                url: "data:image/jpeg;base64,abc123"
              }
            }
          ]
        }
      ]
    });
  });
});
