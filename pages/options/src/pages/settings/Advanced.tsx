import { useState, useEffect } from 'react';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { featureSettingsStorage } from '@extension/storage/lib/feature-settings';
import WebhookSettings from './WebhookSettings';
import AIPromptSettings from './AIPromptSettings';
import AIModelSettings from './AIModelSettings';
import FeatureSettings from './FeatureSettings';

type SettingTab = 'general' | 'webhook' | 'ai' | 'model';

const Advanced = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const featureSettings = useStorage(featureSettingsStorage);
  const [activeTab, setActiveTab] = useState<SettingTab>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return (tab as SettingTab) || 'general';
  });

  const tabs = [
    { id: 'general' as const, name: '功能設定', icon: '⚙️' },
    ...(featureSettings.webhook ? [{ id: 'webhook' as const, name: 'Webhook 設定', icon: '🔌' }] : []),
    ...(featureSettings.aiAssistant
      ? [
          { id: 'model' as const, name: 'AI 模型', icon: '🎯' },
          { id: 'ai' as const, name: 'AI 設定', icon: '🤖' },
        ]
      : []),
  ];

  // 當功能被禁用時，自動切換到 general 標籤
  useEffect(() => {
    if (
      (activeTab === 'webhook' && !featureSettings.webhook) ||
      ((activeTab === 'ai' || activeTab === 'model') && !featureSettings.aiAssistant)
    ) {
      handleTabChange('general');
    }
  }, [featureSettings, activeTab]);

  // 更新 URL 參數
  const updateUrlParams = (tab: SettingTab) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url);
  };

  // 處理標籤切換
  const handleTabChange = (tab: SettingTab) => {
    setActiveTab(tab);
    updateUrlParams(tab);
  };

  // 監聽 URL 變化
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const availableTabs = tabs.map(t => t.id);
      if (!tab || !availableTabs.includes(tab as SettingTab)) {
        const defaultTab = tabs[0].id;
        setActiveTab(defaultTab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', defaultTab);
        window.history.replaceState({}, '', url);
      } else {
        setActiveTab(tab as SettingTab);
      }
    };

    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tabs]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">進階設定</h2>

      {/* 標籤列 */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8" aria-label="設定分類">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? `border-blue-500 text-blue-600 dark:text-blue-400`
                  : `border-transparent ${
                      isLight ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-300'
                    } hover:border-gray-300`
              }`}>
              <span className="flex items-center space-x-2">
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.name}</span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* 內容區域 */}
      <div className="mt-4">
        {activeTab === 'general' && <FeatureSettings />}
        {activeTab === 'webhook' && featureSettings.webhook && <WebhookSettings />}
        {activeTab === 'ai' && featureSettings.aiAssistant && (
          <AIPromptSettings handleTabChange={handleTabChange as (tab: string) => void} />
        )}
        {activeTab === 'model' && featureSettings.aiAssistant && (
          <AIModelSettings handleTabChange={handleTabChange as (tab: string) => void} />
        )}
      </div>
    </div>
  );
};

export default Advanced;
