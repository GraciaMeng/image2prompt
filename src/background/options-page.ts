import type { RuntimeMessage } from "../shared/messages";
import { openExtensionOptionsPage } from "../shared/options-page";

export function registerOptionsPageHandler() {
  chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
    if (message.type !== "OPEN_OPTIONS_PAGE") {
      return false;
    }

    void openExtensionOptionsPage().catch((error) => {
      console.error("Failed to open options page", error);
    });
    return false;
  });
}
