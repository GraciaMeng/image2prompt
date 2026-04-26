export const DEV_HOT_FILE = "hot-update.json";
export const DEV_POLL_INTERVAL = 1200;

type HotPayload = {
  buildId: string;
};

export async function readHotUpdatePayload(): Promise<HotPayload | null> {
  try {
    const response = await fetch(`${chrome.runtime.getURL(DEV_HOT_FILE)}?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as HotPayload;
  } catch {
    return null;
  }
}
