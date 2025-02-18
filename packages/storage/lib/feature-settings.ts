import { createStorage } from './base/base.js';
import { StorageEnum } from './base/enums.js';

export interface FeatureSettings {
  webhook: boolean;
  aiAssistant: boolean;
  contextMenuParent: boolean;
}

export const defaultFeatureSettings: FeatureSettings = {
  webhook: false,
  aiAssistant: false,
  contextMenuParent: false,
};

export const featureSettingsStorage = createStorage<FeatureSettings>('featureSettings', defaultFeatureSettings, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});
