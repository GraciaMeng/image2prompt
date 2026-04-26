import { registerActionStateSync } from "./action-state";
import { registerAnalysisHandler } from "./llm-client";
import { registerContextMenu, registerContextMenuHandler } from "./context-menu";
import { registerDevReloadHandler } from "./dev-reload";
import { registerOptionsPageHandler } from "./options-page";

registerContextMenu();
registerContextMenuHandler();
registerAnalysisHandler();
registerActionStateSync();
registerDevReloadHandler();
registerOptionsPageHandler();
