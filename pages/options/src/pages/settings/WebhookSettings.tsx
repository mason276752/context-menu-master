import { useState } from 'react';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { webhookSettingsStorage, type WebhookConfig, type HttpMethod } from '@extension/storage/lib/webhook-settings';

const defaultJsonTemplates = [
  {
    id: 'simple',
    name: '簡單範例',
    content: `{
  "message": "Hello World",
  "timestamp": "{{timestamp}}",
  "data": {
    "text": "{{text}}"
  }
}`,
  },
  {
    id: 'advanced',
    name: '進階範例',
    content: `{
  "type": "notification",
  "timestamp": "{{timestamp}}",
  "source": "browser-extension",
  "data": {
    "title": "{{title}}",
    "content": "{{text}}",
    "url": "{{url}}",
    "metadata": {
      "browser": "{{browser}}",
      "version": "{{version}}"
    }
  }
}`,
  },
];

const WebhookSettings = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const settings = useStorage(webhookSettingsStorage);
  const webhooks = Array.isArray(settings) ? settings : [];

  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newWebhook, setNewWebhook] = useState<Partial<WebhookConfig>>({
    method: 'GET',
    headers: {},
    enabled: true,
  });
  const [newHeader, setNewHeader] = useState({ key: '', value: '' });
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [isValidJson, setIsValidJson] = useState(true);
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  const methodId = 'webhook-method';
  const headersId = 'webhook-headers';
  const bodyId = 'webhook-body';

  const validateUrl = (url: string) => {
    if (!url) {
      setIsValidUrl(false);
      return;
    }
    try {
      new URL(url);
      setIsValidUrl(true);
    } catch {
      setIsValidUrl(false);
    }
  };

  const validateJson = (json: string) => {
    if (!json) {
      setIsValidJson(true);
      return;
    }
    try {
      JSON.parse(json);
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  };

  const handleAddHeader = () => {
    if (!newHeader.key || !newHeader.value) return;
    setNewWebhook(prev => ({
      ...prev,
      headers: { ...(prev.headers || {}), [newHeader.key]: newHeader.value },
    }));
    setNewHeader({ key: '', value: '' });
  };

  const handleRemoveHeader = (key: string) => {
    setNewWebhook(prev => {
      const headers = { ...(prev.headers || {}) };
      delete headers[key];
      return { ...prev, headers };
    });
  };

  const handleMethodChange = (method: HttpMethod) => {
    setNewWebhook(prev => ({ ...prev, method }));
    if (method === 'GET' || method === 'DELETE') {
      setNewWebhook(prev => ({ ...prev, body: undefined }));
    }
  };

  const handleAddWebhook = () => {
    if (!newWebhook.name || !newWebhook.url || !isValidUrl) return;
    if ((newWebhook.method === 'POST' || newWebhook.method === 'PUT') && newWebhook.body && !isValidJson) return;

    const webhook: WebhookConfig = {
      id: Date.now().toString(),
      name: newWebhook.name || '',
      url: newWebhook.url || '',
      method: newWebhook.method || 'GET',
      headers: newWebhook.headers || {},
      body: newWebhook.body,
      enabled: true,
    };

    webhookSettingsStorage.set(prev => [...(Array.isArray(prev) ? prev : []), webhook]);
    setNewWebhook({ method: 'GET', headers: {}, enabled: true });
    setNewHeader({ key: '', value: '' });
  };

  const handleTemplateClick = (template: (typeof defaultJsonTemplates)[0]) => {
    setNewWebhook(prev => ({ ...prev, body: template.content }));
    validateJson(template.content);
    setShowTemplates(false);
  };

  const handleEditClick = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setNewWebhook({
      ...webhook,
      headers: { ...webhook.headers },
    });
  };

  const handleEditSave = () => {
    if (!editingWebhook || !newWebhook.name || !newWebhook.url || !isValidUrl) return;
    if ((newWebhook.method === 'POST' || newWebhook.method === 'PUT') && newWebhook.body && !isValidJson) return;

    webhookSettingsStorage.set(prev =>
      prev.map(webhook =>
        webhook.id === editingWebhook.id
          ? {
              ...(newWebhook as WebhookConfig),
              id: editingWebhook.id,
              enabled: editingWebhook.enabled,
            }
          : webhook,
      ),
    );

    setEditingWebhook(null);
    setNewWebhook({ method: 'GET', headers: {}, enabled: true });
  };

  const handleEditCancel = () => {
    setEditingWebhook(null);
    setNewWebhook({ method: 'GET', headers: {}, enabled: true });
  };

  const handleToggleEnabled = (webhook: WebhookConfig) => {
    webhookSettingsStorage.set(prev =>
      prev.map(w =>
        w.id === webhook.id
          ? {
              ...w,
              enabled: !w.enabled,
            }
          : w,
      ),
    );
  };

  const handleDeleteWebhook = (webhookId: string) => {
    if (window.confirm('確定要刪除這個 Webhook 嗎？')) {
      webhookSettingsStorage.set(prev => prev.filter(webhook => webhook.id !== webhookId));
    }
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-lg border ${!isLight && 'border-gray-700'} space-y-6`}>
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium">新增 Webhook</h4>
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
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="webhookName">
                Webhook 名稱
              </label>
              <input
                id="webhookName"
                type="text"
                value={newWebhook.name || ''}
                onChange={e => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                placeholder="為您的 Webhook 取個名字"
                className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="webhookUrl">
                Webhook URL
              </label>
              <input
                id="webhookUrl"
                type="text"
                value={newWebhook.url || ''}
                onChange={e => {
                  setNewWebhook(prev => ({ ...prev, url: e.target.value }));
                  validateUrl(e.target.value);
                }}
                placeholder="輸入 Webhook URL"
                className={`w-full p-2 rounded border focus:outline-none focus:ring-2 ${
                  isValidUrl ? 'border-gray-300' : 'border-red-500'
                } ${!isLight && 'bg-gray-700 text-white'} ${isValidUrl ? 'focus:ring-blue-500' : 'focus:ring-red-500'}`}
              />
              {!isValidUrl && (
                <div className={`text-sm ${isLight ? 'text-red-500' : 'text-red-400'}`}>請輸入有效的 URL 格式</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor={methodId}>
                HTTP Method
              </label>
              <div id={methodId} className="flex space-x-2">
                {(['GET', 'POST', 'PUT', 'DELETE'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => handleMethodChange(method)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      newWebhook.method === method
                        ? `${isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-900 text-blue-100'}`
                        : `${
                            isLight
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`
                    }`}>
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor={headersId}>
                Headers
              </label>
              <div id={headersId} className="flex space-x-2">
                <input
                  type="text"
                  value={newHeader.key}
                  onChange={e => setNewHeader(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="Header Key"
                  className={`flex-1 p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                  }`}
                />
                <input
                  type="text"
                  value={newHeader.value}
                  onChange={e => setNewHeader(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Header Value"
                  className={`flex-1 p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddHeader}
                  disabled={!newHeader.key || !newHeader.value}
                  className={`px-4 py-2 rounded text-white ${
                    !newHeader.key || !newHeader.value
                      ? `${isLight ? 'bg-gray-300' : 'bg-gray-600'} cursor-not-allowed`
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}>
                  新增
                </button>
              </div>
              {Object.entries(newWebhook.headers || {}).length > 0 && (
                <div className={`mt-2 p-2 rounded ${isLight ? 'bg-gray-50' : 'bg-gray-800'}`}>
                  {Object.entries(newWebhook.headers || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-1">
                      <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                        {key}: {value}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveHeader(key)}
                        className="text-sm text-red-500 hover:text-red-700">
                        移除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(newWebhook.method === 'POST' || newWebhook.method === 'PUT') && (
              <div className="space-y-2">
                <label className="block text-sm font-medium" htmlFor={bodyId}>
                  Request Body (JSON)
                </label>
                <textarea
                  id={bodyId}
                  value={newWebhook.body || ''}
                  onChange={e => {
                    setNewWebhook(prev => ({ ...prev, body: e.target.value }));
                    validateJson(e.target.value);
                  }}
                  placeholder="輸入 JSON 格式的請求內容"
                  rows={6}
                  className={`w-full p-2 rounded border focus:outline-none focus:ring-2 ${
                    isValidJson ? 'border-gray-300' : 'border-red-500'
                  } ${!isLight && 'bg-gray-700 text-white'} ${isValidJson ? 'focus:ring-blue-500' : 'focus:ring-red-500'}`}
                />
                {!isValidJson && (
                  <div className={`text-sm ${isLight ? 'text-red-500' : 'text-red-400'}`}>請輸入有效的 JSON 格式</div>
                )}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={`text-sm text-blue-500 hover:text-blue-700 ${!isLight && 'hover:text-blue-400'}`}>
                    選擇 JSON 範本
                  </button>
                </div>

                {showTemplates && (
                  <div
                    className={`mt-2 p-2 border rounded-lg ${isLight ? 'bg-gray-50' : 'bg-gray-800 border-gray-700'}`}>
                    <div className="text-sm font-medium mb-2">JSON 範本：</div>
                    <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                      {defaultJsonTemplates.map(template => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleTemplateClick(template)}
                          className={`p-3 rounded-lg text-left transition-colors ${
                            isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'
                          }`}>
                          <div className="font-medium">{template.name}</div>
                          <pre className={`text-sm mt-2 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                            {template.content}
                          </pre>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddWebhook}
              disabled={!newWebhook.name || !newWebhook.url || !isValidUrl || !isValidJson}
              className={`px-4 py-2 rounded text-white ${
                !newWebhook.name || !newWebhook.url || !isValidUrl || !isValidJson
                  ? `${isLight ? 'bg-gray-300' : 'bg-gray-600'} cursor-not-allowed`
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}>
              新增 Webhook
            </button>
          </div>
        </div>
      </div>
      {webhooks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-4">已儲存的 Webhook</h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {webhooks.map(webhook => (
              <div
                key={webhook.id}
                className={`p-4 rounded-lg border ${
                  isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
                } hover:shadow-md transition-shadow duration-200`}>
                {editingWebhook?.id === webhook.id ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" htmlFor="webhookName">
                        Webhook 名稱
                      </label>
                      <input
                        id="webhookName"
                        type="text"
                        value={newWebhook.name || ''}
                        onChange={e => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="為您的 Webhook 取個名字"
                        className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium" htmlFor="webhookUrl">
                        Webhook URL
                      </label>
                      <input
                        id="webhookUrl"
                        type="text"
                        value={newWebhook.url || ''}
                        onChange={e => {
                          setNewWebhook(prev => ({ ...prev, url: e.target.value }));
                          validateUrl(e.target.value);
                        }}
                        placeholder="輸入 Webhook URL"
                        className={`w-full p-2 rounded border focus:outline-none focus:ring-2 ${
                          isValidUrl ? 'border-gray-300' : 'border-red-500'
                        } ${!isLight && 'bg-gray-700 text-white'} ${isValidUrl ? 'focus:ring-blue-500' : 'focus:ring-red-500'}`}
                      />
                      {!isValidUrl && (
                        <div className={`text-sm ${isLight ? 'text-red-500' : 'text-red-400'}`}>
                          請輸入有效的 URL 格式
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">HTTP Method</label>
                      <div className="flex space-x-2">
                        {(['GET', 'POST', 'PUT', 'DELETE'] as const).map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => handleMethodChange(method)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              newWebhook.method === method
                                ? `${isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-900 text-blue-100'}`
                                : `${
                                    isLight
                                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  }`
                            }`}>
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Headers</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newHeader.key}
                          onChange={e => setNewHeader(prev => ({ ...prev, key: e.target.value }))}
                          placeholder="Header Key"
                          className={`flex-1 p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                          }`}
                        />
                        <input
                          type="text"
                          value={newHeader.value}
                          onChange={e => setNewHeader(prev => ({ ...prev, value: e.target.value }))}
                          placeholder="Header Value"
                          className={`flex-1 p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleAddHeader}
                          disabled={!newHeader.key || !newHeader.value}
                          className={`px-4 py-2 rounded text-white ${
                            !newHeader.key || !newHeader.value
                              ? `${isLight ? 'bg-gray-300' : 'bg-gray-600'} cursor-not-allowed`
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}>
                          新增
                        </button>
                      </div>
                      {Object.entries(newWebhook.headers || {}).length > 0 && (
                        <div className={`mt-2 p-2 rounded ${isLight ? 'bg-gray-50' : 'bg-gray-800'}`}>
                          {Object.entries(newWebhook.headers || {}).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between py-1">
                              <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                                {key}: {value}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveHeader(key)}
                                className="text-sm text-red-500 hover:text-red-700">
                                移除
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {(newWebhook.method === 'POST' || newWebhook.method === 'PUT') && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Request Body (JSON)</label>
                        <div className="space-y-2">
                          <textarea
                            value={newWebhook.body || ''}
                            onChange={e => {
                              setNewWebhook(prev => ({ ...prev, body: e.target.value }));
                              validateJson(e.target.value);
                            }}
                            placeholder="輸入 JSON 格式的請求內容"
                            rows={6}
                            className={`w-full p-2 rounded border focus:outline-none focus:ring-2 ${
                              isValidJson ? 'border-gray-300' : 'border-red-500'
                            } ${!isLight && 'bg-gray-700 text-white'} ${isValidJson ? 'focus:ring-blue-500' : 'focus:ring-red-500'}`}
                          />
                          {!isValidJson && (
                            <div className={`text-sm ${isLight ? 'text-red-500' : 'text-red-400'}`}>
                              請輸入有效的 JSON 格式
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setShowTemplates(!showTemplates)}
                              className={`text-sm text-blue-500 hover:text-blue-700 ${!isLight && 'hover:text-blue-400'}`}>
                              選擇 JSON 範本
                            </button>
                          </div>

                          {showTemplates && (
                            <div
                              className={`mt-2 p-2 border rounded-lg ${isLight ? 'bg-gray-50' : 'bg-gray-800 border-gray-700'}`}>
                              <div className="text-sm font-medium mb-2">JSON 範本：</div>
                              <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                                {defaultJsonTemplates.map(template => (
                                  <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => handleTemplateClick(template)}
                                    className={`p-3 rounded-lg text-left transition-colors ${
                                      isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'
                                    }`}>
                                    <div className="font-medium">{template.name}</div>
                                    <pre className={`text-sm mt-2 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                                      {template.content}
                                    </pre>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        className={`px-3 py-1 rounded-full ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}>
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleEditSave}
                        disabled={!newWebhook.name || !newWebhook.url || !isValidUrl || !isValidJson}
                        className={`px-3 py-1 rounded-full text-white ${
                          !newWebhook.name || !newWebhook.url || !isValidUrl || !isValidJson
                            ? `${isLight ? 'bg-gray-300' : 'bg-gray-600'} cursor-not-allowed`
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}>
                        儲存
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-lg">{webhook.name}</div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(webhook)}
                          className={`text-sm px-3 py-1 rounded-full ${
                            webhook.enabled
                              ? `${isLight ? 'bg-green-100 text-green-800' : 'bg-green-900 text-green-100'}`
                              : `${isLight ? 'bg-gray-100 text-gray-800' : 'bg-gray-700 text-gray-300'}`
                          }`}>
                          {webhook.enabled ? '已啟用' : '已停用'}
                        </button>
                        <span
                          className={`text-sm px-3 py-1 rounded-full ${
                            isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-900 text-blue-100'
                          }`}>
                          {webhook.method}
                        </span>
                      </div>
                    </div>
                    <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                      <div>URL: {webhook.url}</div>
                      {Object.keys(webhook.headers).length > 0 && (
                        <div className="mt-2">
                          <div className="font-medium mb-1">Headers:</div>
                          {Object.entries(webhook.headers).map(([key, value]) => (
                            <div key={key} className="pl-2">
                              {key}: {value}
                            </div>
                          ))}
                        </div>
                      )}
                      {webhook.body && (
                        <div className="mt-2">
                          <div className="font-medium mb-1">Body:</div>
                          <pre className="pl-2 whitespace-pre-wrap">{webhook.body}</pre>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(webhook)}
                        className={`text-sm px-3 py-1 rounded-full 
                          ${isLight ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 ' : 'bg-blue-900 text-blue-100 hover:bg-blue-800'}`}>
                        修改
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className={`text-sm px-3 py-1 rounded-full 
                          ${isLight ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-900 text-red-100 hover:bg-red-800'}`}>
                        刪除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookSettings;
