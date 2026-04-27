import { registerContentMessageHandler } from "./analyze-controller";
import { startHoverToolbar } from "./image-hover-toolbar";
import { startTrackingContextImage } from "./image-target-tracker";

startTrackingContextImage();
startHoverToolbar();
registerContentMessageHandler();
