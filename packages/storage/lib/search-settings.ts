import { createStorage } from './base/base.js';
import { StorageEnum } from './base/enums.js';

export interface SearchEngine {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  queryTemplate?: string;
}

export const searchSettingsStorage = createStorage<SearchEngine[]>('searchSettings', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});
