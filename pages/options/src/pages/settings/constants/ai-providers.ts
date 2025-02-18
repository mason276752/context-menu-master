export interface AIProvider {
  name: string;
  apiEndpoint: string;
  requiresKey: boolean;
  models: { name: string; description: string; maxTokens: number }[];
}

export const aiProviders: AIProvider[] = [
  {
    name: 'OpenAI',
    apiEndpoint: 'https://api.openai.com/v1',
    requiresKey: true,
    models: [
      { name: 'gpt-4o', description: '最新最強大的 GPT-4 模型', maxTokens: 4096 },
      { name: 'gpt-4o-mini', description: 'GPT-4 的輕量版本', maxTokens: 2048 },
      { name: 'o1', description: '平衡性能與速度的 GPT-4 版本', maxTokens: 4096 },
      { name: 'o3-mini', description: '快速且經濟的 GPT-4 版本', maxTokens: 2048 },
      { name: 'o1-mini', description: '適合一般任務的 GPT-4 版本', maxTokens: 2048 },
      { name: 'gpt-3.5-turbo', description: '快速且經濟的選擇', maxTokens: 2048 },
    ],
  },
  {
    name: 'Anthropic',
    apiEndpoint: 'https://api.anthropic.com/v1',
    requiresKey: true,
    models: [
      { name: 'claude-3-opus-latest', description: '最強大的 Claude 模型，支援多模態', maxTokens: 50000 },
      { name: 'claude-3-5-sonnet-latest', description: '平衡效能與速度的 Claude 模型', maxTokens: 50000 },
      { name: 'claude-3-5-haiku-latest', description: '快速響應的 Claude 模型', maxTokens: 50000 },
    ],
  },
  {
    name: 'Gemini',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    requiresKey: true,
    models: [
      { name: 'gemini-2.0-flash', description: '最新的 Gemini 2.0 模型', maxTokens: 2048 },
      { name: 'gemini-2.0-flash-lite-preview-02-05', description: 'Gemini 2.0 的輕量預覽版', maxTokens: 1024 },
      { name: 'gemini-1.5-flash', description: '快速且穩定的 Gemini 1.5', maxTokens: 2048 },
      { name: 'gemini-1.5-flash-8b', description: '輕量級的 Gemini 1.5', maxTokens: 1024 },
      { name: 'gemini-1.5-pro', description: '專業版 Gemini 1.5', maxTokens: 2048 },
    ],
  },
  {
    name: 'Groq',
    apiEndpoint: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    models: [
      { name: 'deepseek-r1-distill-llama-70b', description: '70B 參數的 DeepSeek 模型', maxTokens: 2048 },
      { name: 'deepseek-r1-distill-qwen-32b', description: '32B 參數的 DeepSeek-Qwen 模型', maxTokens: 2048 },
      { name: 'gemma2-9b-it', description: 'Google 的 Gemma2 指令微調版', maxTokens: 1024 },
      { name: 'llama-3.1-8b-instant', description: '快速響應的 LLaMA 3.1', maxTokens: 1024 },
      { name: 'llama-3.2-1b-preview', description: '輕量級 LLaMA 3.2 預覽版', maxTokens: 512 },
      { name: 'llama-3.2-3b-preview', description: '中型 LLaMA 3.2 預覽版', maxTokens: 1024 },
      { name: 'llama-3.3-70b-specdec', description: '70B LLaMA 3.3 專用版', maxTokens: 2048 },
      { name: 'llama-3.3-70b-versatile', description: '70B LLaMA 3.3 通用版', maxTokens: 2048 },
      { name: 'llama-guard-3-8b', description: 'LLaMA Guard 安全模型', maxTokens: 1024 },
      { name: 'llama3-70b-8192', description: '支援長上下文的 LLaMA3', maxTokens: 2048 },
      { name: 'llama3-8b-8192', description: '輕量級長上下文 LLaMA3', maxTokens: 1024 },
      { name: 'mixtral-8x7b-32768', description: 'Mixtral 混合專家模型', maxTokens: 2048 },
      { name: 'qwen-2.5-32b', description: '通義千問 2.5 通用版', maxTokens: 2048 },
      { name: 'qwen-2.5-coder-32b', description: '通義千問 2.5 程式設計版', maxTokens: 2048 },
    ],
  },
  {
    name: 'Grok',
    apiEndpoint: 'https://api.x.ai/v1',
    requiresKey: true,
    models: [
      { name: 'grok-1', description: 'Grok 基礎版本', maxTokens: 1024 },
      { name: 'grok-2', description: 'Grok 進階版本', maxTokens: 2048 },
      { name: 'grok-3-latest', description: 'Grok 最新版本', maxTokens: 4096 },
    ],
  },
  {
    name: 'Ollama',
    apiEndpoint: 'http://localhost:11434',
    requiresKey: false,
    models: [],
  },
  {
    name: 'Custom(OpenAI)',
    apiEndpoint: '',
    requiresKey: true,
    models: [],
  },
];

export const API_ENDPOINTS = {
  OpenAI: '/chat/completions',
  Gemini: '/',
  Anthropic: '/messages',
  Groq: '/chat/completions',
  Grok: '/chat/completions',
  Ollama: '/api/chat',
  'Custom(OpenAI)': '/chat/completions',
} as const;
