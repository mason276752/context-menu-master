import { useState } from 'react';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { aiSettingsStorage, aiPromptSettingsStorage, type AIConfig } from '@extension/storage/lib/ai-settings';
import { v4 as uuidv4 } from 'uuid';
import { aiProviders, type AIProvider, API_ENDPOINTS } from './constants/ai-providers';

const AIModelSettings = (props: { handleTabChange: (tab: string) => void }) => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [selectedProvider, setSelectedProvider] = useState(aiProviders[0]);
  const [apiKey, setApiKey] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [customModel, setCustomModel] = useState('');
  const [showModels, setShowModels] = useState(false);
  const [filteredModels, setFilteredModels] = useState(selectedProvider.models);
  const [maxTokens, setMaxTokens] = useState<number>(1024);
  const settings = useStorage(aiSettingsStorage);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [editingApiKey, setEditingApiKey] = useState('');
  const [showEditApiKey, setShowEditApiKey] = useState(false);
  const [editingMaxTokens, setEditingMaxTokens] = useState<number>(1024);
  const [editingModel, setEditingModel] = useState('');
  const [editingEndpoint, setEditingEndpoint] = useState('');
  const [showEditModels, setShowEditModels] = useState(false);
  const [editingFilteredModels, setEditingFilteredModels] = useState<typeof selectedProvider.models>([]);
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider);
    setCustomModel('');
    setFilteredModels(provider.models);

    if (provider.name === 'Ollama') {
      setCustomEndpoint('http://localhost:11434');
    } else if (provider.name === 'Custom(OpenAI)') {
      setCustomEndpoint('https://api.deepseek.com');
    } else {
      setCustomEndpoint('');
    }

    if (provider.name === 'Custom(OpenAI)') {
      setMaxTokens(1024);
    }
  };

  const handleModelClick = (model: { name: string; description: string; maxTokens: number }) => {
    setCustomModel(model.name);
    setMaxTokens(model.maxTokens);
    setShowModels(false);
  };

  const handleModelInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomModel(value);
    setShowModels(true);

    if (value.trim()) {
      const filtered = selectedProvider.models.filter(
        model =>
          model.name.toLowerCase().includes(value.toLowerCase()) ||
          model.description.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredModels(filtered);
    } else {
      setFilteredModels(selectedProvider.models);
    }
  };

  const handleModelInputBlur = () => {
    setTimeout(() => {
      setShowModels(false);
    }, 200);
  };

  const handleSaveConfig = () => {
    if (!selectedProvider || (!apiKey && selectedProvider.requiresKey)) return;

    const newConfig: AIConfig = {
      id: uuidv4(),
      provider: selectedProvider.name,
      model: customModel,
      maxTokens: maxTokens,
      apiEndpoint:
        selectedProvider.name === 'Custom(OpenAI)' || selectedProvider.name === 'Ollama'
          ? customEndpoint
          : selectedProvider.apiEndpoint,
      apiKey: apiKey,
    };

    aiSettingsStorage.set(prev => [...prev, newConfig]);

    // 重置表單
    setApiKey('');
    setCustomModel('');
    setMaxTokens(1024);
    setCustomEndpoint('');
    setShowApiKey(false);
    setShowModels(false);
  };

  const handleDeleteConfig = (config: AIConfig) => {
    if (!config) return;

    const confirmDelete = window.confirm(
      `確定要刪除 ${config.provider} - ${config.model} 的設定嗎？\n這將同時刪除使用此設定的所有 Prompt。`,
    );

    if (!confirmDelete) return;

    aiSettingsStorage.set(prev => prev.filter(c => c.id !== config.id));

    aiPromptSettingsStorage.set(prev => {
      if (!Array.isArray(prev)) return [];
      return prev.filter(prompt => prompt.aiConfigId !== config.id);
    });
  };

  const handleEditModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditingModel(value);
    setShowEditModels(true);

    const provider = aiProviders.find(p => p.name === editingConfig?.provider);
    if (provider && value.trim()) {
      const filtered = provider.models.filter(
        model =>
          model.name.toLowerCase().includes(value.toLowerCase()) ||
          model.description.toLowerCase().includes(value.toLowerCase()),
      );
      setEditingFilteredModels(filtered);
    } else if (provider) {
      setEditingFilteredModels(provider.models);
    }
  };

  const handleEditModelClick = (model: { name: string; description: string; maxTokens: number }) => {
    setEditingModel(model.name);
    setEditingMaxTokens(model.maxTokens);
    setShowEditModels(false);
  };

  const handleEditModelBlur = () => {
    setTimeout(() => {
      setShowEditModels(false);
    }, 200);
  };

  const handleEditConfig = (config: AIConfig) => {
    setEditingConfig(config);
    setEditingApiKey(config.apiKey);
    setEditingModel(config.model);
    setEditingMaxTokens(config.maxTokens);
    setEditingEndpoint(config.apiEndpoint);
    setShowEditApiKey(false);

    const provider = aiProviders.find(p => p.name === config.provider);
    if (provider) {
      setEditingFilteredModels(provider.models);
    }
  };

  const handleSaveEdit = () => {
    if (!editingConfig) return;

    aiSettingsStorage.set(prev =>
      prev.map(config =>
        config.id === editingConfig.id
          ? {
              ...config,
              apiKey: editingApiKey,
              model: editingModel,
              maxTokens: editingMaxTokens,
              apiEndpoint: editingEndpoint,
            }
          : config,
      ),
    );

    setEditingConfig(null);
    setEditingApiKey('');
    setEditingModel('');
    setEditingMaxTokens(1024);
    setEditingEndpoint('');
  };

  return (
    <div className="space-y-6">
      {/* 新增模型表單 */}
      <div className={`p-6 rounded-lg border ${!isLight && 'border-gray-700'} space-y-6`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">新增 AI 模型</h3>
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
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {aiProviders.map(provider => (
              <button
                key={provider.name}
                type="button"
                onClick={() => handleProviderChange(provider)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  selectedProvider.name === provider.name
                    ? isLight
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-blue-900 border-blue-800'
                    : isLight
                      ? 'bg-white border-gray-200 hover:bg-gray-50'
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                }`}>
                <div className="font-medium text-lg">{provider.name}</div>
                {provider.name !== 'Custom(OpenAI)' && (
                  <div className={`text-sm mt-2 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    {provider.apiEndpoint}
                  </div>
                )}
              </button>
            ))}
          </div>

          {selectedProvider && (
            <div className="space-y-6">
              {(selectedProvider.name === 'Custom(OpenAI)' || selectedProvider.name === 'Ollama') && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium" htmlFor="customEndpoint">
                    自定義 API 端點
                  </label>
                  <input
                    id="customEndpoint"
                    type="text"
                    value={customEndpoint}
                    onChange={e => setCustomEndpoint(e.target.value)}
                    placeholder="請輸入 API 端點 URL"
                    className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                    }`}
                  />
                  <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    請輸入 API 端點 URL，包含路徑
                  </p>
                  {selectedProvider.name === 'Ollama' && (
                    <div className={`mt-2 p-4 rounded-lg ${isLight ? 'bg-blue-50' : 'bg-blue-900'}`}>
                      <p className={`text-sm ${isLight ? 'text-blue-600' : 'text-blue-200'}`}>
                        使用 Ollama 需要以下設定之一：
                        <br />
                        1. 啟動時設定：
                        <code className="mx-1 px-2 py-1 rounded bg-opacity-20 bg-blue-200">
                          OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=chrome-extension://* ollama serve
                        </code>
                        <br />
                        2. 或是執行：
                        <code className="mx-1 px-2 py-1 rounded bg-opacity-20 bg-blue-200">
                          ollama origin add chrome-extension://*
                        </code>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {(selectedProvider.models.length > 0 ||
                selectedProvider.name === 'Custom(OpenAI)' ||
                selectedProvider.name === 'Ollama') && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium" htmlFor="modelInput">
                    {selectedProvider.name === 'Custom(OpenAI)' ? '自定義模型名稱' : '選擇或輸入模型'}
                  </label>
                  <div className="relative">
                    <input
                      id="modelInput"
                      type="text"
                      value={customModel}
                      onChange={handleModelInputChange}
                      onFocus={() => setShowModels(true)}
                      onBlur={handleModelInputBlur}
                      placeholder={
                        selectedProvider.name === 'Custom(OpenAI)' || selectedProvider.name === 'Ollama'
                          ? '輸入自定義模型名稱'
                          : `輸入或選擇 ${selectedProvider.name} 模型`
                      }
                      className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                      }`}
                    />
                    {selectedProvider.models.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowModels(!showModels)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md ${
                          isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-600'
                        }`}>
                        {showModels ? '▼' : '▲'}
                      </button>
                    )}
                  </div>
                  {showModels && selectedProvider.models.length > 0 && (
                    <div
                      className={`mt-1 border rounded-md ${
                        isLight ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600'
                      }`}>
                      {filteredModels.length > 0 ? (
                        filteredModels.map(model => (
                          <button
                            key={model.name}
                            type="button"
                            onClick={() => handleModelClick(model)}
                            className={`w-full text-left p-2 hover:bg-opacity-10 ${
                              customModel === model.name ? (isLight ? 'bg-blue-50' : 'bg-blue-900') : ''
                            } ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}>
                            <div className="font-medium">{model.name}</div>
                            <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                              {model.description}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">手動輸入模型"{customModel}"</div>
                      )}
                    </div>
                  )}
                  {(selectedProvider.name === 'Custom(OpenAI)' || selectedProvider.name === 'Ollama') && (
                    <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>請輸入您想使用的模型名稱</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium" htmlFor="maxTokens">
                  最大 Token 數
                </label>
                <input
                  id="maxTokens"
                  type="number"
                  min="1"
                  max="102400"
                  value={maxTokens}
                  onChange={e => setMaxTokens(Number(e.target.value))}
                  className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                  }`}
                />
                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  設定單次請求的最大 Token 數量限制
                </p>
              </div>

              {selectedProvider.requiresKey && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium" htmlFor="apiKey">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="輸入 API Key"
                      className={`w-full p-2 rounded border pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md ${
                        isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-600'
                      }`}>
                      {showApiKey ? '隱藏' : '顯示'}
                    </button>
                  </div>
                </div>
              )}

              <div className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                完整 API 端點:{' '}
                {(customEndpoint || selectedProvider.apiEndpoint) +
                  (API_ENDPOINTS[selectedProvider.name as keyof typeof API_ENDPOINTS] || '') +
                  (selectedProvider.name === 'Gemini' ? customModel + ':generateContent' : '')}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  disabled={!selectedProvider || (!apiKey && selectedProvider.requiresKey)}
                  className={`px-4 py-2 rounded text-white ${
                    !selectedProvider || (!apiKey && selectedProvider.requiresKey)
                      ? isLight
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gray-700 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}>
                  儲存設定
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 已儲存的模型列表 */}
      {settings && settings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-4">已儲存的 AI 設定</h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {settings.map(config => (
              <div
                key={`${config.provider}-${config.model}`}
                className={`p-4 rounded-lg border ${
                  isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
                } hover:shadow-md transition-shadow duration-200`}>
                <div className="flex-1 space-y-2">
                  {editingConfig?.id === config.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-lg">{config.provider}</div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium mb-1" htmlFor="editModel">
                            模型名稱
                          </label>
                          <div className="relative">
                            <input
                              id="editModel"
                              type="text"
                              value={editingModel}
                              onChange={handleEditModelChange}
                              onFocus={() => setShowEditModels(true)}
                              onBlur={handleEditModelBlur}
                              placeholder={`輸入或選擇 ${config.provider} 模型`}
                              className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                              }`}
                            />
                            {editingFilteredModels.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setShowEditModels(!showEditModels)}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md ${
                                  isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-600'
                                }`}>
                                {showEditModels ? '▼' : '▲'}
                              </button>
                            )}
                          </div>
                          {showEditModels && editingFilteredModels.length > 0 && (
                            <div
                              className={`mt-1 border rounded-md ${
                                isLight ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600'
                              }`}>
                              {editingFilteredModels.map(model => (
                                <button
                                  key={model.name}
                                  type="button"
                                  onClick={() => handleEditModelClick(model)}
                                  className={`w-full text-left p-2 hover:bg-opacity-10 ${
                                    editingModel === model.name ? (isLight ? 'bg-blue-50' : 'bg-blue-900') : ''
                                  } ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}>
                                  <div className="font-medium">{model.name}</div>
                                  <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {model.description}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {(config.provider === 'Custom(OpenAI)' || config.provider === 'Ollama') && (
                          <div>
                            <label className="block text-sm font-medium mb-1" htmlFor="editEndpoint">
                              API 端點
                            </label>
                            <input
                              id="editEndpoint"
                              type="text"
                              value={editingEndpoint}
                              onChange={e => setEditingEndpoint(e.target.value)}
                              className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                              }`}
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium mb-1" htmlFor="editApiKey">
                            API Key
                          </label>
                          <div className="relative">
                            <input
                              id="editApiKey"
                              type={showEditApiKey ? 'text' : 'password'}
                              value={editingApiKey}
                              onChange={e => setEditingApiKey(e.target.value)}
                              placeholder="輸入新的 API Key"
                              className={`w-full p-2 rounded border pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowEditApiKey(!showEditApiKey)}
                              className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded ${
                                isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-600'
                              }`}>
                              {showEditApiKey ? '隱藏' : '顯示'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" htmlFor="editMaxTokens">
                            最大 Token 數
                          </label>
                          <input
                            id="editMaxTokens"
                            type="number"
                            min="1"
                            max="102400"
                            value={editingMaxTokens}
                            onChange={e => setEditingMaxTokens(Number(e.target.value))}
                            className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                            }`}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingConfig(null)}
                            className={`px-3 py-1 rounded ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}>
                            取消
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1 rounded text-white bg-blue-500 hover:bg-blue-600">
                            儲存
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-lg">{config.provider}</div>
                        <div
                          className={`text-sm px-2 py-1 rounded-full ${
                            isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-900 text-blue-100'
                          }`}>
                          {config.model}
                        </div>
                      </div>
                      <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} space-y-1`}>
                        <div>API 端點: {config.apiEndpoint}</div>
                        <div>最大 Token 數: {config.maxTokens}</div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditConfig(config)}
                          className={`text-sm px-3 py-1 rounded-full ${
                            isLight
                              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              : 'bg-blue-900 text-blue-100 hover:bg-blue-800'
                          }`}>
                          修改
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteConfig(config)}
                          className={`text-sm px-3 py-1 rounded-full ${
                            isLight
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-red-900 text-red-100 hover:bg-red-800'
                          }`}>
                          刪除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIModelSettings;
