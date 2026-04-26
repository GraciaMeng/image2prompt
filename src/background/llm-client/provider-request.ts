import type { AnalyzeImageMessage } from "../../shared/messages";
import type { ExtensionSettings } from "../../shared/types";

export function getChatCompletionsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/chat/completions`;
}

export function buildAnalysisRequestBody(
  settings: ExtensionSettings,
  message: AnalyzeImageMessage,
  modelImageUrl: string
) {
  return {
    model: settings.model,
    stream: true,
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content: settings.systemPrompt
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `请分析这张图片并提取最终 prompt。当前网页：${message.payload.pageUrl}`
          },
          {
            type: "image_url",
            image_url: {
              url: modelImageUrl
            }
          }
        ]
      }
    ]
  };
}
