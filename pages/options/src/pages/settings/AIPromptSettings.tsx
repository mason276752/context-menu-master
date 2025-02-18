import { useState } from 'react';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import {
  aiSettingsStorage,
  aiPromptSettingsStorage,
  type AIConfig,
  type AIPrompt,
} from '@extension/storage/lib/ai-settings';
import { webhookSettingsStorage } from '@extension/storage/lib/webhook-settings';
import { PromptCard } from './components/PromptCard';
import { v4 as uuidv4 } from 'uuid';

const defaultPrompts = [
  {
    name: '翻譯',
    prompt: '請將以下文字翻譯成繁體中文：\n{{text}}',
    enabled: true,
    provider: 'OpenAI',
    model: 'gpt-4',
  },
  {
    name: '摘要',
    prompt: '請幫我總結以下內容的重點：\n{{text}}',
    enabled: true,
    provider: 'OpenAI',
    model: 'gpt-4',
  },
  {
    name: '解釋',
    prompt: '請用簡單的語言解釋以下內容：\n{{text}}',
    enabled: true,
    provider: 'OpenAI',
    model: 'gpt-4',
  },
];

const AIPromptSettings = (props: { handleTabChange: (tab: string) => void }) => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const savedPrompts = useStorage(aiPromptSettingsStorage);
  const prompts = Array.isArray(savedPrompts) ? savedPrompts : [];
  const [newPrompt, setNewPrompt] = useState<Partial<AIPrompt>>({
    name: '',
    prompt: '',
    enabled: true,
  });
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<AIConfig | null>(null);
  const [showAISettings, setShowAISettings] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const settings = useStorage(aiSettingsStorage);
  const webhooks = useStorage(webhookSettingsStorage);
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  // 篩選出可用的 webhook (POST 和 PUT 方法)
  const availableWebhooks = webhooks.filter(webhook => webhook.method === 'POST' || webhook.method === 'PUT');

  const handleToggleEnabled = (prompt: AIPrompt) => {
    aiPromptSettingsStorage.set(prev =>
      prev.map(p => {
        return p.id === prompt.id ? { ...p, enabled: !p.enabled } : p;
      }),
    );
  };

  const handleConfigSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const config = settings?.find(c => c.id === selectedValue);
    setSelectedConfig(config || null);
  };

  const handleAddPrompt = () => {
    if (!newPrompt.name || !newPrompt.prompt || !selectedConfig) return;

    const prompt: AIPrompt = {
      id: uuidv4(),
      name: newPrompt.name,
      model: selectedConfig.model,
      provider: selectedConfig.provider,
      aiConfigId: selectedConfig.id,
      prompt: newPrompt.prompt,
      responseFormat: newPrompt.responseFormat,
      enabled: true,
      webhookId: newPrompt.webhookId,
    };

    aiPromptSettingsStorage.set(prev => [...(Array.isArray(prev) ? prev : []), prompt]);
    setNewPrompt({});
    setSelectedConfig(null);
    setShowTemplates(false);
  };

  const handleDeletePrompt = (prompt: AIPrompt) => {
    if (window.confirm('確定要刪除這個 Prompt 嗎？')) {
      aiPromptSettingsStorage.set(prev => prev.filter(p => p.id !== prompt.id));
    }
  };

  const handleEditClick = (prompt: AIPrompt) => {
    if (!prompt) return;

    setEditingPromptId(prompt.id);
    setEditingPrompt(prompt);
  };

  const handleEditChange = (field: keyof AIPrompt, value: string | boolean) => {
    setEditingPrompt(prev => {
      if (!prev) return prev;

      if (field === 'aiConfigId') {
        const config = settings?.find(c => c.id === value);
        if (config) {
          return {
            ...prev,
            [field]: value,
            provider: config.provider,
            model: config.model,
          };
        }
      }
      return { ...prev, [field]: value };
    });
  };

  const handleEditSave = (prompt: AIPrompt) => {
    if (!editingPrompt || !editingPrompt.name || !editingPrompt.prompt) return;

    aiPromptSettingsStorage.set(prev => {
      if (!Array.isArray(prev)) return [];
      return prev.map(p => {
        return p.id === prompt.id ? editingPrompt : p;
      });
    });

    setEditingPromptId(null);
    setEditingPrompt(null);
  };

  const handleEditCancel = () => {
    setEditingPromptId(null);
    setEditingPrompt(null);
  };

  const handleAddModel = () => {
    props.handleTabChange('model');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className={`p-6 rounded-lg border ${!isLight && 'border-gray-700'} space-y-6`}>
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium">新增 Prompt</h4>
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
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium" htmlFor="aiConfig">
                  選擇 AI 模型
                </label>
                <button
                  type="button"
                  onClick={() => handleAddModel()}
                  className={`text-sm text-blue-500 hover:text-blue-700 ${!isLight && 'hover:text-blue-400'}`}>
                  新增 AI 模型
                </button>
              </div>
              {settings && settings.length > 0 ? (
                <select
                  id="aiConfig"
                  value={selectedConfig ? selectedConfig.id : ''}
                  onChange={handleConfigSelect}
                  className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                  }`}>
                  <option value="">請選擇 AI 模型</option>
                  {settings.map(config => (
                    <option key={config.id} value={config.id}>
                      {config.provider} - {config.model}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  尚未設定任何 AI 配置，請先新增 AI 模型
                </div>
              )}
            </div>

            {selectedConfig && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium" htmlFor="promptName">
                    Prompt 名稱
                  </label>
                  <input
                    id="promptName"
                    type="text"
                    value={newPrompt.name || ''}
                    onChange={e => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="為您的 Prompt 取個名字"
                    className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium" htmlFor="promptContent">
                    Prompt 內容
                  </label>
                  <div className="space-y-1">
                    <textarea
                      id="promptContent"
                      value={newPrompt.prompt || ''}
                      onChange={e => setNewPrompt(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder="輸入 Prompt 內容，使用 {{text}} 作為替換文字"
                      rows={4}
                      className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                      }`}
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowTemplates(!showTemplates)}
                        className={`text-sm underline ${
                          isLight ? 'text-blue-500 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                        選擇常用 Prompt
                      </button>
                    </div>

                    {showTemplates && (
                      <div
                        className={`mt-2 p-2 border rounded ${isLight ? 'bg-gray-50' : 'bg-gray-800 border-gray-700'}`}>
                        <div className="text-sm font-medium mb-2">常用 Prompt：</div>
                        <div className="space-y-2">
                          {defaultPrompts.map(template => (
                            <button
                              key={template.name}
                              type="button"
                              onClick={() => {
                                setNewPrompt(prev => ({
                                  ...prev,
                                  name: template.name,
                                  prompt: template.prompt,
                                }));
                                setShowTemplates(false);
                              }}
                              className={`w-full text-left p-2 rounded ${
                                isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'
                              }`}>
                              <div className="font-medium">{template.name}</div>
                              <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                                {template.prompt}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium" htmlFor="responseFormat">
                    回應格式 JSON Schema (選填)
                  </label>
                  <div className="space-y-1">
                    <textarea
                      id="responseFormat"
                      value={newPrompt.responseFormat || ''}
                      onChange={e => setNewPrompt(prev => ({ ...prev, responseFormat: e.target.value }))}
                      placeholder="輸入期望的回應格式，需符合 JSON Schema 格式"
                      rows={4}
                      className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                      }`}
                    />
                    <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                      欲了解 JSON Schema 格式，請參考{' '}
                      <a
                        href="https://json-schema.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600">
                        JSON Schema 官方文件
                      </a>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium" htmlFor="webhookSelect">
                    關聯的 Webhook (選填)
                  </label>
                  <select
                    id="webhookSelect"
                    value={newPrompt.webhookId || ''}
                    onChange={e => setNewPrompt(prev => ({ ...prev, webhookId: e.target.value || undefined }))}
                    className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                    }`}>
                    <option value="">無</option>
                    {availableWebhooks.map(webhook => (
                      <option key={webhook.id} value={webhook.id}>
                        {webhook.name} ({webhook.method})
                      </option>
                    ))}
                  </select>
                  <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    若有設定 JSON Sechma 則會將 JSON 直接作為 POST data
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddPrompt}
                disabled={!selectedConfig || !newPrompt.name || !newPrompt.prompt}
                className={`px-4 py-2 rounded text-white ${
                  !selectedConfig || !newPrompt.name || !newPrompt.prompt
                    ? `${isLight ? 'bg-gray-300' : 'bg-gray-600'} cursor-not-allowed`
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}>
                新增 Prompt
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">已儲存 AI Prompt</h3>
        </div>

        {prompts.length > 0 && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {prompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                isLight={isLight}
                onToggle={() => handleToggleEnabled(prompt)}
                onDelete={() => handleDeletePrompt(prompt)}
                isEditing={editingPromptId === prompt.id}
                editingPrompt={editingPrompt}
                onEdit={() => handleEditClick(prompt)}
                onEditChange={handleEditChange}
                onEditSave={() => handleEditSave(prompt)}
                onEditCancel={handleEditCancel}
                availableWebhooks={availableWebhooks}
                settings={settings}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPromptSettings;
