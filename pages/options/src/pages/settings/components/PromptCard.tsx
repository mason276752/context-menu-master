import { type AIPrompt, type AIConfig } from '@extension/storage/lib/ai-settings';
import { type WebhookConfig } from '@extension/storage/lib/webhook-settings';

interface PromptCardProps {
  prompt: AIPrompt;
  isLight: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isEditing: boolean;
  editingPrompt: AIPrompt | null;
  onEdit: () => void;
  onEditChange: (field: keyof AIPrompt, value: string | boolean) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  availableWebhooks: WebhookConfig[];
  settings: AIConfig[];
}

export const PromptCard = ({
  prompt,
  isLight,
  onToggle,
  onDelete,
  isEditing,
  editingPrompt,
  onEdit,
  onEditChange,
  onEditSave,
  onEditCancel,
  availableWebhooks,
  settings,
}: PromptCardProps) => {
  return (
    <div className={`p-6 rounded-lg ${isLight ? 'bg-white shadow-sm' : 'bg-gray-700'}`}>
      {isEditing && editingPrompt ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            onEditSave();
          }}
          className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">選擇 AI 模型</label>
            <select
              value={editingPrompt.aiConfigId}
              onChange={e => onEditChange('aiConfigId', e.target.value)}
              className={`w-full px-3 py-2 rounded border ${
                isLight ? 'border-gray-300 focus:border-blue-500' : 'border-gray-600 bg-gray-800 focus:border-blue-400'
              }`}>
              {settings.map(config => (
                <option key={config.id} value={config.id}>
                  {config.provider} - {config.model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">名稱</label>
            <input
              type="text"
              value={editingPrompt.name}
              onChange={e => onEditChange('name', e.target.value)}
              className={`w-full px-3 py-2 rounded border ${
                isLight ? 'border-gray-300 focus:border-blue-500' : 'border-gray-600 bg-gray-800 focus:border-blue-400'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">提示詞模板</label>
            <textarea
              value={editingPrompt.prompt}
              onChange={e => onEditChange('prompt', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 rounded border ${
                isLight ? 'border-gray-300 focus:border-blue-500' : 'border-gray-600 bg-gray-800 focus:border-blue-400'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">回應格式 JSON Schema (選填)</label>
            <textarea
              value={editingPrompt.responseFormat || ''}
              onChange={e => onEditChange('responseFormat', e.target.value)}
              rows={4}
              placeholder="輸入期望的回應格式，需符合 JSON Schema 格式"
              className={`w-full px-3 py-2 rounded border ${
                isLight ? 'border-gray-300 focus:border-blue-500' : 'border-gray-600 bg-gray-800 focus:border-blue-400'
              }`}
            />
            <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
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

          <div>
            <label className="block text-sm font-medium mb-2">關聯的 Webhook (選填)</label>
            <select
              value={editingPrompt.webhookId || ''}
              onChange={e => onEditChange('webhookId', e.target.value || undefined)}
              className={`w-full px-3 py-2 rounded border ${
                isLight ? 'border-gray-300 focus:border-blue-500' : 'border-gray-600 bg-gray-800 focus:border-blue-400'
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

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onEditCancel}
              className={`px-3 py-1 rounded ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}>
              取消
            </button>
            <button type="submit" className="px-3 py-1 rounded text-white bg-blue-500 hover:bg-blue-600">
              儲存
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium text-lg">{prompt.name}</div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onToggle}
                className={`text-sm px-3 py-1 rounded-full ${
                  prompt.enabled
                    ? `${isLight ? 'bg-green-100 text-green-800' : 'bg-green-900 text-green-100'}`
                    : `${isLight ? 'bg-gray-200 text-gray-800' : 'bg-gray-700 text-gray-300'}`
                }`}>
                {prompt.enabled ? '已啟用' : '已停用'}
              </button>
              <button
                type="button"
                onClick={onEdit}
                className={`text-sm px-3 py-1 rounded-full ${
                  isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-900 text-blue-100'
                }`}>
                修改
              </button>
              <button
                type="button"
                onClick={onDelete}
                className={`text-sm px-3 py-1 rounded-full ${
                  isLight ? 'bg-red-50 text-red-600' : 'bg-red-900 text-red-100'
                }`}>
                刪除
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>{prompt.prompt}</div>
            {prompt.responseFormat && (
              <div className="text-sm">
                <span className="font-medium">回應格式: </span>
                <pre
                  className={`text-left overflow-x-auto mt-1 p-2 rounded ${isLight ? 'bg-gray-100' : 'bg-gray-800'}`}>
                  {prompt.responseFormat}
                </pre>
              </div>
            )}
            <div
              className={`text-sm px-2 py-1 rounded-full inline-block ${
                isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-900 text-blue-100'
              }`}>
              {prompt.provider} - {prompt.model}
            </div>
            {prompt.webhookId && (
              <div className="text-sm">
                <span className="font-medium">關聯的 Webhook: </span>
                {availableWebhooks.find(w => w.id === prompt.webhookId)?.name || '未找到 Webhook'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
