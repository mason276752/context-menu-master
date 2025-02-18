import { createStorage } from './base/base.js';
import { StorageEnum } from './base/enums.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
  enabled: boolean;
}

export const webhookSettingsStorage = createStorage<WebhookConfig[]>('webhookSettings', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});
