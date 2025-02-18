import { createStorage } from './base/base.js';
import { StorageEnum } from './base/enums.js';

interface HistoryPrompt {
  id: string;
  status: 'processing' | 'success' | 'error';
  promptName: string;
  result: string;
  webhook?: HistoryWebhook | undefined;
}

export interface HistoryWebhook {
  id: string;
  status: 'processing' | 'success' | 'error';
  webhookId: string;
  webhookName: string;
  result: string;
}

export interface HistoryRecord {
  id: string;
  text: string;
  timestamp: number;
  url?: string;
  prompt?: { [key: string]: HistoryPrompt };
  webhook?: { [key: string]: HistoryWebhook[] };
}

export const historyStorage = createStorage<HistoryRecord[]>('historySettings', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const historyLimitStorage = createStorage<number>('historyLimit', 10, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});
