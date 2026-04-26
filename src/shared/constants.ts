import type {
  AnalysisLibraryStore,
  ExtensionSettings,
  ModelPreset,
  PromptPreset,
  SettingsStore
} from "./types";

export const MENU_ID = "image2prompt-analyze";
export const SETTINGS_KEY = "image2prompt-settings";
export const ANALYSIS_LIBRARY_KEY = "image2prompt-analysis-library";
export const ANALYSIS_LIBRARY_SCHEMA_VERSION = 1;
export const ANALYSIS_RECORDS_LIMIT = 24;
export const SAVED_PRESETS_LIMIT = 12;

export const DEFAULT_SYSTEM_PROMPT = `你是一名顶级视觉提示词工程师。请基于输入图片，提取可用于 AI 绘图模型复现相似风格与构图的高质量提示词。

输出要求：
1. 直接输出最终提示词，不要写分析过程，不要加标题。
2. 提示词需覆盖主体、构图、镜头语言、场景、材质、光线、色彩、风格、细节质量。
3. 尽量使用适合 Midjourney、Flux、SDXL 等模型理解的英文提示词；如果有必要，可附少量中文说明。
4. 如果图片里有文字、logo、水印或 UI，请判断是否应忽略，并在提示词中避免不必要复现。
5. 如果无法识别细节，请基于可见内容做合理推断，并保持提示词自然完整。

请只返回一段可以直接复制使用的 prompt。`;

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: "general-recreation",
    label: "通用复刻",
    description: "适合大多数图片分析场景，兼顾构图、材质、光线和风格还原。",
    recommendedModel: "gpt-4.1-mini",
    systemPrompt: DEFAULT_SYSTEM_PROMPT
  },
  {
    id: "cinematic-shot",
    label: "电影感镜头",
    description: "强调镜头语言、景别、布光和情绪氛围，适合海报、剧照、叙事画面。",
    recommendedModel: "gpt-4.1-mini",
    systemPrompt: `你是一名擅长电影镜头拆解的视觉提示词导演。请基于输入图片，输出一段可直接用于 AI 绘图模型的高质量 prompt。

输出要求：
1. 只输出最终 prompt，不要解释。
2. 重点描述主体、镜头焦段、景别、机位、构图、动作、环境、灯光、色彩分级、情绪氛围。
3. 优先使用适合 Midjourney、Flux、SDXL 的英文提示词，可混合少量必要中文。
4. 如果画面里有无关文字、水印、界面元素，请忽略，不要主动复现。
5. 当细节不完整时，请做合理且审美一致的补充，让提示词自然、完整、具有画面感。`
  },
  {
    id: "product-commercial",
    label: "产品商业图",
    description: "强化主体材质、卖点、布光和商业广告质感，适合商品主图与品牌物料。",
    recommendedModel: "gpt-4.1-mini",
    systemPrompt: `你是一名商业广告视觉总监。请分析输入图片，并输出一段适合 AI 绘图模型复现产品商业图的最终 prompt。

输出要求：
1. 只返回一段最终 prompt，不要包含分析说明。
2. 重点覆盖产品主体、材质细节、摆放方式、背景环境、光线类型、反射与阴影、商业拍摄风格、质感关键词。
3. 提示词优先使用清晰的英文短语组合，适配 Midjourney、Flux、SDXL 等模型。
4. 如存在 logo、文字或包装信息，仅在对画面风格有必要时抽象概括，不要逐字复现。
5. 如果图片存在不清晰区域，请基于商业摄影语境做合理补足，保证成片质感。`
  },
  {
    id: "design-ui-illustration",
    label: "设计与插画",
    description: "适合 UI、海报、平面视觉和插画，突出风格、版式与图形语言。",
    recommendedModel: "gpt-4.1-mini",
    systemPrompt: `你是一名擅长视觉设计与插画拆解的提示词策划师。请根据输入图片输出一段可直接使用的最终 prompt。

输出要求：
1. 直接输出 prompt，不要额外说明。
2. 重点提取视觉风格、版式结构、图形元素、色彩系统、字体气质、插画语言、材质与细节。
3. 优先使用适合生成模型理解的英文关键词，并保持语义紧凑、可执行。
4. 对于图片中的真实文案、品牌名或界面控件，仅在必要时概括其设计特征，避免无意义复现。
5. 当画面同时包含 UI 与插画元素时，请平衡描述信息层级，让 prompt 既保留设计语言，也保留图像氛围。`
  }
];

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: "openai-gpt-4_1-mini",
    label: "OpenAI / GPT-4.1 mini",
    description: "默认推荐。成本与效果平衡，适合日常图片分析与流式输出。",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini"
  },
  {
    id: "openai-gpt-4_1",
    label: "OpenAI / GPT-4.1",
    description: "质量优先，适合复杂图像、细节较多或需要更稳定推理的场景。",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1"
  },
  {
    id: "compat-openai-style",
    label: "兼容 OpenAI 接口",
    description: "适合使用自建网关或第三方 OpenAI-compatible 服务时作为起点。",
    baseUrl: "https://your-openai-compatible-endpoint/v1",
    model: "gpt-4.1-mini"
  }
];

export const DEFAULT_PROMPT_PRESET_ID = PROMPT_PRESETS[0].id;
export const DEFAULT_MODEL_PRESET_ID = MODEL_PRESETS[0].id;

export const DEFAULT_SETTINGS: ExtensionSettings = {
  apiKey: "",
  baseUrl: MODEL_PRESETS[0].baseUrl,
  model: MODEL_PRESETS[0].model,
  systemPrompt: PROMPT_PRESETS[0].systemPrompt
};

export const SETTINGS_SCHEMA_VERSION = 2;

export const DEFAULT_SETTINGS_STORE: SettingsStore = {
  version: SETTINGS_SCHEMA_VERSION,
  settings: DEFAULT_SETTINGS,
  promptPresetId: DEFAULT_PROMPT_PRESET_ID,
  modelPresetId: DEFAULT_MODEL_PRESET_ID,
  updatedAt: new Date(0).toISOString()
};

export const DEFAULT_ANALYSIS_LIBRARY_STORE: AnalysisLibraryStore = {
  version: ANALYSIS_LIBRARY_SCHEMA_VERSION,
  records: [],
  savedPresets: [],
  updatedAt: new Date(0).toISOString()
};
