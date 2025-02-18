import { type HistoryRecord } from '@extension/storage/lib/history-settings';
import { type AIPrompt } from '@extension/storage/lib/ai-settings';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { aiPromptSettingsStorage } from '@extension/storage/lib/ai-settings';
import { useNavigate, useParams } from 'react-router';

interface AssistantTabProps {
  record?: HistoryRecord;
}

export const AssistantTab = ({ record }: AssistantTabProps) => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const aiPrompts = useStorage(aiPromptSettingsStorage);

  const getStatusColor = (promptStatus: string, webhookStatus: string | undefined, isLight: boolean) => {
    if (promptStatus === 'success' && webhookStatus && (webhookStatus === 'error' || webhookStatus === 'pending')) {
      return isLight
        ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
        : 'bg-yellow-900 border-yellow-700 text-yellow-200';
    }

    switch (promptStatus) {
      case 'processing':
      case 'success':
        return isLight ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-gray-900 border-gray-700 text-gray-200';
      case 'error':
        return isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-900 border-red-700 text-red-200';
      default:
        return isLight ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-gray-900 border-gray-700 text-gray-200';
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
      {aiPrompts.map(prompt => {
        const promptResult = record?.prompt?.[prompt.name];
        const status = promptResult?.status || 'unexecuted';
        const webhookStatus = promptResult?.webhook?.status;
        console.log('prompt.name', prompt.name);
        console.log('status', status);
        console.log('webhookStatus', webhookStatus);
        return (
          <div key={prompt.name} className="space-y-2">
            <h3 className="text-lg font-medium">{prompt.name}</h3>
            <div
              onClick={() => navigate(`/history/${id}/prompt/${prompt.name}`)}
              className={`p-4 rounded-lg border ${getStatusColor(status, webhookStatus, isLight)} cursor-pointer hover:opacity-90`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl" role="img" aria-label={status}>
                    {getStatusIcon(status)}
                  </span>
                  <span className="font-medium">{getStatusText(status)}</span>
                </div>
                <div className="text-sm">
                  {prompt.provider} - {prompt.model}
                </div>
              </div>
              <div className={`mt-2 text-sm ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                {promptResult?.result ? '點擊查看執行結果' : '點擊執行提示詞'}
                {status === 'success' && webhookStatus && (
                  <span className="ml-1">{webhookStatus === 'pending' ? '(Webhook 處理中)' : '(Webhook 失敗)'}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {aiPrompts.length === 0 && (
        <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>尚未設定任何提示詞</div>
      )}
    </div>
  );
};
