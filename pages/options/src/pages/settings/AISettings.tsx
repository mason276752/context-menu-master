import { useState, useEffect } from 'react';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { aiSettingsStorage, aiPromptSettingsStorage, type AIConfig } from '@extension/storage/lib/ai-settings';
import { v4 as uuidv4 } from 'uuid';
interface AIProvider {
  name: string;
  apiEndpoint: string;
  requiresKey: boolean;
  models: { name: string; description: string; maxTokens: number }[];
}

const aiProviders: AIProvider[] = [
  {
    name: 'OpenAI',
    apiEndpoint: 'https://api.openai.com/v1',
    requiresKey: true,
    models: [
      { name: 'gpt-4o', description: '最新最強大的 GPT-4 模型', maxTokens: 128000 },
      { name: 'gpt-4o-mini', description: 'GPT-4 的輕量版本', maxTokens: 32000 },
      { name: 'o1', description: '平衡性能與速度的 GPT-4 版本', maxTokens: 32000 },
      { name: 'o3-mini', description: '快速且經濟的 GPT-4 版本', maxTokens: 16000 },
      { name: 'o1-mini', description: '適合一般任務的 GPT-4 版本', maxTokens: 8192 },
      { name: 'gpt-3.5-turbo', description: '快速且經濟的選擇', maxTokens: 16385 },
    ],
  },
  {
    name: 'Anthropic',
    apiEndpoint: 'https://api.anthropic.com/v1',
    requiresKey: true,
    models: [
      { name: 'claude-3-opus-latest', description: '最強大的 Claude 模型，支援多模態', maxTokens: 200000 },
      { name: 'claude-3-5-sonnet-latest', description: '平衡效能與速度的 Claude 模型', maxTokens: 100000 },
      { name: 'claude-3-5-haiku-latest', description: '快速響應的 Claude 模型', maxTokens: 50000 },
    ],
  },
  {
    name: 'Gemini',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    requiresKey: true,
    models: [
      { name: 'gemini-2.0-flash', description: '最新的 Gemini 2.0 模型', maxTokens: 32768 },
      { name: 'gemini-2.0-flash-lite-preview-02-05', description: 'Gemini 2.0 的輕量預覽版', maxTokens: 16384 },
      { name: 'gemini-1.5-flash', description: '快速且穩定的 Gemini 1.5', maxTokens: 32768 },
      { name: 'gemini-1.5-flash-8b', description: '輕量級的 Gemini 1.5', maxTokens: 16384 },
      { name: 'gemini-1.5-pro', description: '專業版 Gemini 1.5', maxTokens: 32768 },
    ],
  },
  {
    name: 'Groq',
    apiEndpoint: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    models: [
      { name: 'deepseek-r1-distill-llama-70b', description: '70B 參數的 DeepSeek 模型', maxTokens: 32768 },
      { name: 'deepseek-r1-distill-qwen-32b', description: '32B 參數的 DeepSeek-Qwen 模型', maxTokens: 32768 },
      { name: 'gemma2-9b-it', description: 'Google 的 Gemma2 指令微調版', maxTokens: 8192 },
      { name: 'llama-3.1-8b-instant', description: '快速響應的 LLaMA 3.1', maxTokens: 8192 },
      { name: 'llama-3.2-1b-preview', description: '輕量級 LLaMA 3.2 預覽版', maxTokens: 4096 },
      { name: 'llama-3.2-3b-preview', description: '中型 LLaMA 3.2 預覽版', maxTokens: 8192 },
      { name: 'llama-3.3-70b-specdec', description: '70B LLaMA 3.3 專用版', maxTokens: 32768 },
      { name: 'llama-3.3-70b-versatile', description: '70B LLaMA 3.3 通用版', maxTokens: 32768 },
      { name: 'llama-guard-3-8b', description: 'LLaMA Guard 安全模型', maxTokens: 8192 },
      { name: 'llama3-70b-8192', description: '支援長上下文的 LLaMA3', maxTokens: 8192 },
      { name: 'llama3-8b-8192', description: '輕量級長上下文 LLaMA3', maxTokens: 8192 },
      { name: 'mixtral-8x7b-32768', description: 'Mixtral 混合專家模型', maxTokens: 32768 },
      { name: 'qwen-2.5-32b', description: '通義千問 2.5 通用版', maxTokens: 32768 },
      { name: 'qwen-2.5-coder-32b', description: '通義千問 2.5 程式設計版', maxTokens: 32768 },
    ],
  },
  {
    name: 'Grok',
    apiEndpoint: 'https://api.x.ai/v1',
    requiresKey: true,
    models: [
      { name: 'grok-1', description: 'Grok 基礎版本', maxTokens: 8192 },
      { name: 'grok-2', description: 'Grok 進階版本', maxTokens: 16384 },
      { name: 'grok-3-latest', description: 'Grok 最新版本', maxTokens: 32768 },
    ],
  },
  {
    name: 'Ollama',
    apiEndpoint: 'http://localhost:11434',
    requiresKey: false,
    models: [],
  },
  {
    name: 'Custom(OpenAI)',
    apiEndpoint: '',
    requiresKey: true,
    models: [],
  },
];

const API_ENDPOINTS = {
  OpenAI: '/chat/completions',
  Gemini: '/',
  Anthropic: '/messages',
  Groq: '/chat/completions',
  Grok: '/chat/completions',
  Ollama: '/api/chat',
  'Custom(OpenAI)': '/chat/completions',
} as const;

interface AISettingsProps {
  onClose?: () => void;
}

const AISettings = ({ onClose }: AISettingsProps) => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [selectedProvider, setSelectedProvider] = useState(aiProviders[0]);
  const [apiKey, setApiKey] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [customModel, setCustomModel] = useState('');
  const [showModels, setShowModels] = useState(false);
  const [filteredModels, setFilteredModels] = useState(selectedProvider.models);
  const settings = useStorage(aiSettingsStorage);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [editingApiKey, setEditingApiKey] = useState('');
  const [showEditApiKey, setShowEditApiKey] = useState(false);
  const [maxTokens, setMaxTokens] = useState<number>(1024);
  const [editingMaxTokens, setEditingMaxTokens] = useState<number>(1024);

  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider);
    setCustomModel('');
    setFilteredModels(provider.models);

    if (provider.name === 'Ollama') {
      setCustomEndpoint('http://localhost:11434');
    } else if (provider.name === 'Custom(OpenAI)') {
      setCustomEndpoint('');
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

  useEffect(() => {
    setFilteredModels(selectedProvider.models);
  }, [selectedProvider]);

  const handleAddConfig = () => {
    if (!customModel) {
      alert('請輸入或選擇模型');
      return;
    }

    const newConfig: AIConfig = {
      id: uuidv4(),
      provider: selectedProvider.name,
      model: customModel,
      maxTokens: maxTokens,
      apiEndpoint:
        selectedProvider.name === 'Custom(OpenAI)' || selectedProvider.name === 'Ollama'
          ? customEndpoint || selectedProvider.apiEndpoint
          : selectedProvider.apiEndpoint,
      apiKey: apiKey,
    };

    aiSettingsStorage.set(prev => [...prev, newConfig]);

    // Reset form
    setCustomModel('');
    setApiKey('');
    setMaxTokens(1024);
    if (selectedProvider.name === 'Ollama') {
      setCustomEndpoint('http://localhost:11434');
    } else if (selectedProvider.name === 'Custom(OpenAI)') {
      setCustomEndpoint('');
    } else {
      setCustomEndpoint('');
    }

    onClose?.();
  };

  const handleDeleteConfig = (config: AIConfig) => {
    if (!config) return;

    const confirmDelete = window.confirm(
      `確定要刪除 ${config.provider} - ${config.model} 的設定嗎？\n這將同時刪除使用此設定的所有 Prompt。`,
    );

    if (!confirmDelete) return;

    aiSettingsStorage.set(prev => prev.filter(c => !(c.provider === config.provider && c.model === config.model)));

    aiPromptSettingsStorage.set(prev => {
      if (!Array.isArray(prev)) return [];
      return prev.filter(prompt => {
        return !(prompt.provider === config.provider && prompt.model === config.model);
      });
    });
  };

  const handleEditConfig = (config: AIConfig) => {
    setEditingConfig(config);
    setEditingApiKey(config.apiKey);
    setEditingMaxTokens(config.maxTokens);
    setShowEditApiKey(false);
  };

  const handleSaveConfig = () => {
    if (!editingConfig) return;

    aiSettingsStorage.set(prev =>
      prev.map(config =>
        config.provider === editingConfig.provider && config.model === editingConfig.model
          ? {
              ...config,
              apiKey: editingApiKey,
              maxTokens: editingMaxTokens,
            }
          : config,
      ),
    );

    setEditingConfig(null);
    setEditingApiKey('');
    setEditingMaxTokens(1024);
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-lg border ${!isLight && 'border-gray-700'} space-y-6`}>
        <h3 className="text-lg font-medium">新增 AI 設定</h3>

        <div className="space-y-4">
          <label className="block text-sm font-medium" htmlFor="provider-select">
            選擇 AI 服務提供商
          </label>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {aiProviders.map(provider => (
              <button
                key={provider.name}
                type="button"
                onClick={() => handleProviderChange(provider)}
                className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                  selectedProvider.name === provider.name
                    ? `${isLight ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500' : 'bg-blue-900 border-blue-400'}`
                    : `${isLight ? 'border-gray-300 hover:bg-gray-50' : 'border-gray-600 hover:bg-gray-700'}`
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
        </div>

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
              placeholder="請輸入完整的 API 端點 URL"
              className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
              }`}
            />
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>請輸入 API 端點 URL，包含路徑</p>
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
          <label htmlFor="maxTokens" className="block text-sm font-medium">
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
          <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>設定單次請求的最大 Token 數量限制</p>
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
                placeholder={`輸入 ${selectedProvider.name} API Key`}
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
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              您的 API Key 將安全地存儲在本地。如果不需要可以留空。
            </p>
          </div>
        )}
        <div className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
          完整 API 端點:{' '}
          {(customEndpoint || selectedProvider.apiEndpoint) +
            (API_ENDPOINTS[selectedProvider.name as keyof typeof API_ENDPOINTS] || '') +
            (selectedProvider.name === 'Gemini' ? customModel + ':generateContent' : '')}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleAddConfig}
          disabled={
            (selectedProvider.name === 'Custom(OpenAI)' || selectedProvider.name === 'Ollama') && !customEndpoint
          }
          className={`px-4 py-2 rounded text-white ${
            selectedProvider.name === 'Custom(OpenAI)' && !customEndpoint
              ? `${isLight ? 'bg-gray-300' : 'bg-gray-600'} cursor-not-allowed`
              : 'bg-blue-500 hover:bg-blue-600'
          }`}>
          新增 AI 設定
        </button>
      </div>
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
                  {editingConfig?.provider === config.provider && editingConfig?.model === config.model ? (
                    <div className="mt-2 space-y-2">
                      <div className="relative">
                        <input
                          type={showEditApiKey ? 'text' : 'password'}
                          value={editingApiKey}
                          onChange={e => setEditingApiKey(e.target.value)}
                          placeholder="輸入新的 API Key"
                          className={`w-full p-2 rounded border pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditApiKey(!showEditApiKey)}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md ${
                            isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-600'
                          }`}>
                          {showEditApiKey ? '隱藏' : '顯示'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="editingMaxTokens" className="block text-sm font-medium">
                          最大 Token 數
                        </label>
                        <input
                          id="editingMaxTokens"
                          type="number"
                          min="1"
                          max="102400"
                          value={editingMaxTokens}
                          onChange={e => setEditingMaxTokens(Number(e.target.value))}
                          className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                          }`}
                        />
                        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                          設定單次請求的最大 Token 數量限制
                        </p>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingConfig(null)}
                          className={`px-3 py-1 rounded ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}>
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveConfig}
                          className={`px-3 py-1 rounded text-white bg-blue-500 hover:bg-blue-600`}>
                          儲存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className={`text-sm overflow-hidden ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                        API Key: {config.apiKey.replace(/./g, '•')}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditConfig(config)}
                          className={`text-sm px-3 py-1 rounded-full 
                          ${isLight ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-900 text-blue-100 hover:bg-blue-800'}`}>
                          修改
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteConfig(config)}
                          className={`text-sm px-3 py-1 rounded-full
                          ${isLight ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-900 text-red-100 hover:bg-red-800'}`}>
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

export default AISettings;
