import { type HistoryRecord } from '@extension/storage/lib/history-settings';
import { type WebhookConfig } from '@extension/storage/lib/webhook-settings';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { webhookSettingsStorage } from '@extension/storage/lib/webhook-settings';
import { useNavigate, useParams } from 'react-router';

interface WebhookTabProps {
  record?: HistoryRecord;
}

export const WebhookTab = ({ record }: WebhookTabProps) => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const webhooks = useStorage(webhookSettingsStorage);

  const getStatusColor = (status: 'unexecuted' | 'processing' | 'success' | 'error') => {
    switch (status) {
      case 'unexecuted':
        return isLight ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-gray-900 border-gray-700 text-gray-200';
      case 'processing':
      case 'success':
        return isLight ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-gray-900 border-gray-700 text-gray-200';
      case 'error':
        return isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-900 border-red-700 text-red-200';
    }
  };

  const getStatusText = (status: 'unexecuted' | 'processing' | 'success' | 'error') => {
    switch (status) {
      case 'unexecuted':
        return '未執行';
      case 'processing':
        return '處理中';
      case 'success':
        return '成功';
      case 'error':
        return '錯誤';
    }
  };

  const getStatusIcon = (status: 'unexecuted' | 'processing' | 'success' | 'error') => {
    switch (status) {
      case 'unexecuted':
        return '⚪';
      case 'processing':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
    }
  };

  return (
    <div className="space-y-4">
      {webhooks.map(webhook => {
        const webhookResult = record?.webhook?.[webhook.id]?.[0];
        const status = webhookResult?.status || 'unexecuted';

        return (
          <div key={webhook.id} className="space-y-2">
            <h3 className="text-lg font-medium">{webhook.name}</h3>
            <div
              onClick={() => navigate(`/history/${id}/webhook/${webhook.id}`)}
              className={`p-4 rounded-lg border ${getStatusColor(status)} cursor-pointer hover:opacity-90`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl" role="img" aria-label={status}>
                    {getStatusIcon(status)}
                  </span>
                  <span className="font-medium">{getStatusText(status)}</span>
                </div>
                <div className="text-sm">
                  {webhook.method} - {webhook.url}
                </div>
              </div>
              <div className={`mt-2 text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                {webhookResult?.result ? '點擊查看執行結果' : '點擊執行 Webhook'}
              </div>
            </div>
          </div>
        );
      })}
      {webhooks.length === 0 && (
        <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>尚未設定任何 Webhook</div>
      )}
    </div>
  );
};
