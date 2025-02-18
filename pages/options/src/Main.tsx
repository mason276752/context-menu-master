import '@src/Options.css';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { featureSettingsStorage } from '@extension/storage/lib/feature-settings';

const Main = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const featureSettings = useStorage(featureSettingsStorage);

  const mainFeature = {
    id: 'history',
    title: '歷史記錄',
    description: '自動記錄所有選取的文字和來源頁面，方便日後查找和重新使用。支援快速檢視和重新執行先前的操作。',
    icon: '📝',
  };

  const subFeatures = [
    {
      id: 'search',
      title: 'AI 搜尋',
      description:
        '自訂搜尋引擎與查詢模板，一鍵在 ChatGPT、Felo 等搜尋引擎中查詢。支援自訂查詢文字模板，讓搜尋更精準。',
      icon: '🔍',
    },
    {
      id: 'ai-prompt',
      title: 'AI 助手（進階）',
      description:
        '自訂 AI 助手模板，快速與 ChatGPT、Gemini 等 AI 助手進行對話。支援多種提示詞模板，讓 AI 更懂你的需求。',
      icon: '🤖',
      featureKey: 'aiAssistant' as const,
    },
    {
      id: 'webhook',
      title: 'Webhook 整合（進階）',
      description: '透過 Webhook 將選取的文字傳送到其他服務。支援 GET、POST 等多種請求方式，輕鬆整合各種網路服務。',
      icon: '🔌',
      featureKey: 'webhook' as const,
    },
  ] as const;

  const handleToggleFeature = (featureKey: keyof typeof featureSettings) => {
    featureSettingsStorage.set(prev => ({
      ...prev,
      [featureKey]: !prev[featureKey],
    }));
  };

  const FeatureCard = ({ feature }: { feature: typeof mainFeature | (typeof subFeatures)[number] }) => {
    const isDisabled = 'featureKey' in feature && !featureSettings[feature.featureKey];
    const isClickable = 'featureKey' in feature;

    return (
      <button
        onClick={() => isClickable && handleToggleFeature(feature.featureKey)}
        className={`block w-full p-6 rounded-lg border transition-all ${
          isDisabled
            ? `${isLight ? 'bg-gray-100 border-gray-200' : 'bg-gray-900 border-gray-700'} opacity-50`
            : isClickable
              ? `${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} hover:shadow-lg`
              : `${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} cursor-default`
        } text-left`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl" role="img" aria-label={feature.title}>
              {feature.icon}
            </span>
            <h2 className="text-xl font-semibold">{feature.title}</h2>
          </div>
          {'featureKey' in feature && (
            <div
              className={`px-3 py-1 rounded-full text-sm ${
                isDisabled
                  ? isLight
                    ? 'bg-gray-200 text-gray-600'
                    : 'bg-gray-700 text-gray-400'
                  : isLight
                    ? 'bg-green-100 text-green-800'
                    : 'bg-green-900 text-green-100'
              }`}>
              {isDisabled ? '已停用' : '已啟用'}
            </div>
          )}
        </div>
        <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>{feature.description}</p>
      </button>
    );
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">右鍵大師</h1>
          <p className={`text-lg ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
            強化瀏覽器右鍵選單，整合 AI 對話、智慧搜尋與 Webhook 功能
          </p>
        </div>

        {/* 主要功能 - 歷史記錄 */}
        <div className="mb-6">
          <FeatureCard feature={mainFeature} />
        </div>

        {/* 子功能 */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {subFeatures.map(feature => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>

        <div
          className={`mt-12 p-6 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
          <h2 className="text-2xl font-bold mb-4">使用說明</h2>
          <div className={`space-y-4 text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
            <p>
              1. 選取網頁文字後，點擊右鍵即可使用各項功能
              <br />
              2. AI 搜尋：一鍵在各大搜尋引擎中查詢，支援自訂查詢模板
              <br />
              3. AI 助手：快速與 AI 助手對話，支援多種提示詞模板
              <br />
              4. Webhook 整合：將選取文字傳送到其他服務，支援多種請求方式
              <br />
              5. 歷史記錄：自動保存所有操作，方便日後查找和重新使用
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
