import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { featureSettingsStorage, type FeatureSettings } from '@extension/storage/lib/feature-settings';

const FeatureSettings = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const settings = useStorage(featureSettingsStorage);

  const handleToggleFeature = (feature: keyof FeatureSettings) => {
    featureSettingsStorage.set(prev => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  const features = [
    {
      id: 'contextMenuParent' as const,
      name: '右鍵選單分類',
      description: '在右鍵選單中將功能分類顯示',
    },
    {
      id: 'webhook' as const,
      name: 'Webhook 功能',
      description: '允許將選取的文字發送到指定的 Webhook 端點',
    },
    {
      id: 'aiAssistant' as const,
      name: 'AI 助手',
      description: '使用 AI 模型處理選取的文字',
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">功能管理</h3>
        <div className="space-y-4">
          {features.map(feature => (
            <div
              key={feature.id}
              className={`p-4 rounded-lg border ${
                isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
              }`}>
              <label htmlFor={`toggle-${feature.id}`} className="flex items-center justify-between cursor-pointer">
                <div>
                  <h4 className="text-lg font-medium">{feature.name}</h4>
                  <p className={`mt-1 text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{feature.description}</p>
                </div>
                <button
                  id={`toggle-${feature.id}`}
                  onClick={() => handleToggleFeature(feature.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings[feature.id] ? 'bg-blue-500' : isLight ? 'bg-gray-200' : 'bg-gray-700'
                  }`}>
                  <span className="sr-only">啟用 {feature.name}</span>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings[feature.id] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureSettings;
