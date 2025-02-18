import { createStorage } from './base/base.js';
import { StorageEnum } from './base/enums.js';

export interface AIConfig {
  id: string;
  provider: string;
  model: string;
  maxTokens: number;
  apiEndpoint: string;
  apiKey: string;
}

export const aiSettingsStorage = createStorage<AIConfig[]>('aiSettings', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export interface AIPrompt {
  id: string;
  name: string;
  aiConfigId: string;
  provider: string;
  model: string;
  prompt: string;
  responseFormat?: string;
  enabled: boolean;
  webhookId?: string;
}

export const aiPromptSettingsStorage = createStorage<AIPrompt[]>('aiPromptSettings', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});
