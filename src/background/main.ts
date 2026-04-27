import { registerActionStateSync } from "./action-state";
import { registerAnalysisHandler } from "./llm-client";
import { registerContextMenu, registerContextMenuHandler } from "./context-menu";
import { registerOptionsPageHandler } from "./options-page";

registerContextMenu();
registerContextMenuHandler();
registerAnalysisHandler();
registerActionStateSync();
registerOptionsPageHandler();
