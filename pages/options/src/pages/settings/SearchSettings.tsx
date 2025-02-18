import { useState } from 'react';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { searchSettingsStorage, type SearchEngine } from '@extension/storage/lib/search-settings';
import { SearchEngineCard } from './components/SearchEngineCard';

const searchTemplates = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/?hints=search&q=%s',
    enabled: true,
    queryTemplate: '請以5W2H詳細說明{{text}}',
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    url: 'https://www.perplexity.ai/?q=%s&hl=zh-TW&copilot=true',
    enabled: true,
    queryTemplate: '幫我搜尋{{text}}相關資訊',
  },
  {
    id: 'felo',
    name: 'Felo AI',
    url: 'https://felo.ai/search?q=%s',
    enabled: true,
    queryTemplate: '給我{{text}}的最新資訊',
  },
  {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com/?q=%s',
    enabled: true,
    queryTemplate: '請以正反面分析：\n{{text}}',
  },
];

const SearchSettings = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const settings = useStorage(searchSettingsStorage);
  const searchEngines = Array.isArray(settings) ? settings : [];

  const [newEngine, setNewEngine] = useState<Partial<SearchEngine>>({
    name: '',
    url: '',
  });
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingEngine, setEditingEngine] = useState<SearchEngine | null>(null);
  const [previewText, setPreviewText] = useState('生成式AI');
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  const handleUrlChange = (url: string) => {
    setNewEngine(prev => ({ ...prev, url }));
    validateUrl(url);
  };

  const validateUrl = (url: string) => {
    if (!url) {
      setIsValidUrl(false);
      return;
    }
    try {
      new URL(url.replaceAll('%s', 'test'));
      setIsValidUrl(true);
    } catch {
      setIsValidUrl(false);
    }
  };

  const handleNameChange = (name: string) => {
    setNewEngine(prev => ({ ...prev, name }));
  };

  const handleToggleEnabled = (index: number) => {
    searchSettingsStorage.set(prev => {
      if (!Array.isArray(prev)) return [];
      return prev.map((engine, i) =>
        i === index
          ? {
              ...engine,
              enabled: !engine.enabled,
            }
          : engine,
      );
    });
  };

  const handleAddEngine = () => {
    if (newEngine.name && newEngine.url && isValidUrl) {
      const engine: SearchEngine = {
        id: Date.now().toString(),
        name: newEngine.name,
        url: newEngine.url,
        enabled: true,
        queryTemplate: newEngine.queryTemplate,
      };

      searchSettingsStorage.set(prev => [...(Array.isArray(prev) ? prev : []), engine]);
      setNewEngine({ name: '', url: '' });
      setShowTemplates(false);
    }
  };

  const handleDeleteEngine = (index: number) => {
    if (window.confirm('確定要刪除這個 Search Engine 嗎？')) {
      searchSettingsStorage.set(prev => {
        if (!Array.isArray(prev)) return [];
        return prev.filter((_, i) => i !== index);
      });
    }
  };

  const handleTemplateClick = (template: SearchEngine) => {
    setNewEngine({
      name: template.name,
      url: template.url,
      queryTemplate: template.queryTemplate,
    });
    validateUrl(template.url);
    setShowTemplates(false);
  };

  const handleEditClick = (engine: SearchEngine, index: number) => {
    setEditingIndex(index);
    setEditingEngine({ ...engine });
    setIsValidUrl(true);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditingEngine(null);
  };

  const handleEditSave = (index: number) => {
    if (!editingEngine || !editingEngine.name || !editingEngine.url || !isValidUrl) return;

    searchSettingsStorage.set(prev => {
      if (!Array.isArray(prev)) return [];
      return prev.map((engine, i) => (i === index ? editingEngine : engine));
    });

    setEditingIndex(null);
    setEditingEngine(null);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditingEngine(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const getPreviewUrl = (url: string, queryTemplate?: string, preview: string = '生成式AI') => {
    try {
      const finalQuery = queryTemplate ? queryTemplate.replaceAll(/\{\{text\}\}/g, preview) : preview;
      const encodedQuery = encodeURIComponent(finalQuery);
      return url.replaceAll('%s', encodedQuery);
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-lg border ${!isLight && 'border-gray-700'} space-y-6`}>
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium">新增搜尋引擎</h4>
          <button
            onClick={() => setIsFormExpanded(!isFormExpanded)}
            className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-600'}`}>
            <svg
              className={`w-5 h-5 transform transition-transform ${isFormExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div
          className={`space-y-4 transition-all duration-200 ${
            isFormExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="engineName">
              搜尋引擎名稱
            </label>
            <input
              id="engineName"
              type="text"
              value={newEngine.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="搜尋引擎名稱"
              className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
              }`}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="engineUrl">
              搜尋 URL
            </label>
            <div className="space-y-1">
              <input
                id="engineUrl"
                type="text"
                value={newEngine.url}
                onChange={e => handleUrlChange(e.target.value)}
                placeholder="輸入搜尋 URL (使用 %s 作為搜尋關鍵字替換符)"
                className={`w-full p-2 rounded border focus:outline-none focus:ring-2 ${
                  isValidUrl ? 'border-gray-300' : 'border-red-500'
                } ${!isLight && 'bg-gray-700 text-white'} ${isValidUrl ? 'focus:ring-blue-500' : 'focus:ring-red-500'}`}
              />
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className={`text-sm text-blue-500 hover:text-blue-700 ${!isLight && 'hover:text-blue-400'}`}>
                  選擇常用搜尋引擎
                </button>
                <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>或</span>
                <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  例如: https://www.google.com/search?q=%s
                </span>
              </div>

              {showTemplates && (
                <div className={`mt-2 p-2 border rounded-lg ${isLight ? 'bg-gray-50' : 'bg-gray-800 border-gray-700'}`}>
                  <div className="text-sm font-medium mb-2">常用搜尋引擎：</div>
                  <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                    {searchTemplates.map(template => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateClick(template)}
                        className={`p-3 rounded-lg text-left transition-colors ${
                          isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'
                        }`}>
                        <div className="font-medium">{template.name}</div>
                        <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                          <div>URL: {template.url}</div>
                          {template.queryTemplate && <div className="mt-1">查詢模板: {template.queryTemplate}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!isValidUrl && (
                <div className={`text-sm ${isLight ? 'text-red-500' : 'text-red-400'}`}>請輸入有效的 URL 格式</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="queryTemplate">
              查詢文字模板
            </label>
            <textarea
              id="queryTemplate"
              value={newEngine.queryTemplate || ''}
              onChange={e => setNewEngine(prev => ({ ...prev, queryTemplate: e.target.value }))}
              placeholder="例如：請問{{text}}是什麼"
              rows={3}
              className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
              }`}
            />
            <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              使用 {'{{text}}'} 作為替換文字，支援多行輸入，留空則直接使用搜尋文字
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="previewText">
              預覽文字
            </label>
            <input
              id="previewText"
              type="text"
              value={previewText}
              onChange={e => setPreviewText(e.target.value)}
              placeholder="輸入測試文字"
              className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
              }`}
            />
          </div>

          {newEngine.url && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">預覽：</span>
                <a
                  href={getPreviewUrl(newEngine.url, newEngine.queryTemplate, previewText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm ${
                    isLight ? 'text-blue-600 hover:text-blue-800' : 'text-blue-400 hover:text-blue-300'
                  } hover:underline`}>
                  點我測試
                </a>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddEngine}
              disabled={!newEngine.name || !newEngine.url || !isValidUrl}
              className={`px-4 py-2 rounded text-white ${
                !newEngine.name || !newEngine.url || !isValidUrl
                  ? `${isLight ? 'bg-gray-300' : 'bg-gray-600'} cursor-not-allowed`
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}>
              新增搜尋引擎
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">搜尋設定</h3>
      </div>

      {searchEngines.length > 0 && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {searchEngines.map((engine, index) => (
            <SearchEngineCard
              key={engine.id}
              engine={engine}
              index={index}
              isLight={isLight}
              onEdit={handleEditClick}
              onDelete={handleDeleteEngine}
              onToggle={handleToggleEnabled}
              getPreviewUrl={getPreviewUrl}
              isEditing={editingIndex === index}
              editingEngine={editingEngine}
              onEditChange={handleEditChange}
              onEditSave={handleEditSave}
              onEditCancel={handleEditCancel}
              validateUrl={validateUrl}
              isValidUrl={isValidUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchSettings;
