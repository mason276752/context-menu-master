import { useParams, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { historyStorage } from '@extension/storage/lib/history-settings';
import type { HistoryRecord } from '@extension/storage/lib/history-settings';
import type { SearchEngine } from '@extension/storage/lib/search-settings';
import { SearchEngineTab } from './SearchEngineTab';
import { AssistantTab } from './AssistantTab';
import { WebhookTab } from './WebhookTab';
import { Toast } from '../Toast';
import { featureSettingsStorage } from '@extension/storage/lib/feature-settings';

type TabId = 'search' | 'ai' | 'webhook';

const HistoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const history = useStorage(historyStorage);
  const featureSettings = useStorage(featureSettingsStorage);
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return (tab as TabId) || 'search';
  });
  const [showToast, setShowToast] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  const record = history.find((item: HistoryRecord) => item.id === id);

  const handleSearch = (engine: SearchEngine) => {
    if (record) {
      const query = engine.queryTemplate ? engine.queryTemplate.replaceAll(/\{\{text\}\}/g, record.text) : record.text;

      const searchUrl = engine.url.replaceAll('%s', encodeURIComponent(query));
      window.open(searchUrl, '_blank');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setShowToast(true);
    });
  };

  const tabs = [
    { id: 'search', name: 'AI 搜尋', icon: '🔍' },
    ...(featureSettings.webhook ? [{ id: 'webhook', name: 'Webhook', icon: '🔌' }] : []),
    ...(featureSettings.aiAssistant ? [{ id: 'ai', name: 'AI 助手', icon: '🤖' }] : []),
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'search':
        return <SearchEngineTab record={record} onSearch={handleSearch} />;
      case 'ai':
        return featureSettings.aiAssistant ? <AssistantTab record={record} /> : null;
      case 'webhook':
        return featureSettings.webhook ? <WebhookTab record={record} /> : null;
      default:
        return null;
    }
  };

  const updateUrlParams = (tab: TabId) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url);
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    updateUrlParams(tab);
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (!tab || !['search', 'ai', 'webhook'].includes(tab)) {
        const defaultTab = tabs[0].id;
        setActiveTab(defaultTab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', defaultTab);
        window.history.replaceState({}, '', url);
      } else {
        setActiveTab(tab as TabId);
      }
    };

    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!record) {
    return (
      <div className={`p-6 ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <p className="text-gray-500">找不到該筆記錄</p>
            <button
              onClick={() => navigate('/history')}
              className={`mt-4 px-4 py-2 rounded ${
                isLight ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-700 hover:bg-gray-600'
              }`}>
              返回歷史記錄
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/history')}
            className={`mb-4 px-3 py-1 rounded text-sm ${
              isLight ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-700 hover:bg-gray-600'
            }`}>
            ← 返回
          </button>
          <div className={`p-6 rounded-lg ${isLight ? 'bg-white shadow-sm' : 'bg-gray-700'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="relative group">
                  <p
                    className={`text-lg font-medium mb-2 break-words ${showFullText ? 'cursor-pointer' : 'line-clamp-3 cursor-pointer'}`}
                    onClick={() => setShowFullText(!showFullText)}>
                    {record.text}
                  </p>
                  {!showFullText && (
                    <button
                      onClick={() => setShowFullText(true)}
                      className={`absolute bottom-0 right-0 text-sm px-2 py-1 rounded ${
                        isLight
                          ? 'bg-white text-blue-600 hover:text-blue-800'
                          : 'bg-gray-800 text-blue-400 hover:text-blue-300'
                      }`}>
                      顯示全文
                    </button>
                  )}
                </div>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'} truncate`}>
                  {record.url && (
                    <a href={record.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {record.url}
                    </a>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleCopy(record.text)}
                className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-600'} transition-colors`}
                title="複製文字">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-500">
              <p>
                <span className="font-medium">時間：</span>
                {formatDate(record.timestamp)}
              </p>
            </div>
          </div>

          <div className={`mt-6 rounded-lg ${isLight ? 'bg-white shadow-sm' : 'bg-gray-700'}`}>
            <div className="border-b border-gray-200 dark:border-gray-600">
              <nav className="flex space-x-2 p-4" aria-label="Tabs">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                      activeTab === tab.id
                        ? isLight
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-gray-600 text-white'
                        : isLight
                          ? 'text-gray-500 hover:bg-gray-50'
                          : 'text-gray-300 hover:bg-gray-600'
                    }`}>
                    <span role="img" aria-label={tab.name}>
                      {tab.icon}
                    </span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4">{renderTabContent()}</div>
          </div>
        </div>
      </div>
      {showToast && <Toast message="已複製到剪貼簿" onClose={() => setShowToast(false)} isLight={isLight} />}
    </div>
  );
};

export default HistoryDetail;
