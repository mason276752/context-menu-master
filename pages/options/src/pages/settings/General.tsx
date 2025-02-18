import { useState, useEffect } from 'react';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import SearchSettings from './SearchSettings';
import ThemeSettings from './ThemeSettings';
import HistorySettings from './HistorySettings';

type SettingTab = 'theme' | 'search' | 'history';

const General = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<SettingTab>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return (tab as SettingTab) || 'theme';
  });

  const updateUrlParams = (tab: SettingTab) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url);
  };

  const handleTabChange = (tab: SettingTab) => {
    setActiveTab(tab);
    updateUrlParams(tab);
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (!tab || !['theme', 'search', 'history'].includes(tab)) {
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
  }, []);

  const tabs = [
    { id: 'theme' as const, name: '主題設定', icon: '🎨' },
    { id: 'history' as const, name: '歷史紀錄', icon: '📝' },
    { id: 'search' as const, name: '搜尋設定', icon: '🔍' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">一般設定</h2>

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
        {activeTab === 'theme' && <ThemeSettings />}
        {activeTab === 'history' && <HistorySettings />}
        {activeTab === 'search' && <SearchSettings />}
      </div>
    </div>
  );
};

export default General;
