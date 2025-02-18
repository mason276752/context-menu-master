import { useParams, useNavigate } from 'react-router';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { historyStorage } from '@extension/storage/lib/history-settings';
import { webhookSettingsStorage } from '@extension/storage/lib/webhook-settings';
import type { HistoryRecord } from '@extension/storage/lib/history-settings';
import { useState } from 'react';
import { Toast } from '../../components/Toast';

export const PromptWebhookDetail = () => {
  const { id, promptName, webhookId } = useParams<{ id: string; promptName: string; webhookId: string }>();
  const navigate = useNavigate();
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const history = useStorage(historyStorage);
  const webhooks = useStorage(webhookSettingsStorage);
  const [showToast, setShowToast] = useState(false);

  const record = history.find((item: HistoryRecord) => item.id === id);
  const promptResult = record?.prompt?.[promptName];
  const webhookResult = promptResult?.webhook;
  const webhookConfig = webhooks.find(w => w.id === webhookResult?.webhookId);

  const getStatusColor = (status: 'unexecuted' | 'processing' | 'success' | 'error') => {
    switch (status) {
      case 'processing':
        return isLight ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-gray-900 border-gray-700 text-gray-200';
      case 'success':
        return isLight ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-gray-900 border-gray-700 text-gray-200';
      case 'error':
        return isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-900 border-red-700 text-red-200';
      case 'unexecuted':
        return isLight ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-700 text-gray-200';
    }
  };

  const getStatusText = (status: 'processing' | 'success' | 'error') => {
    switch (status) {
      case 'processing':
        return '處理中';
      case 'success':
        return '執行成功';
      case 'error':
        return '執行失敗';
    }
  };

  const getStatusIcon = (status: 'processing' | 'success' | 'error') => {
    switch (status) {
      case 'processing':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
    }
  };

  const handleExecute = async () => {
    if (!record || !promptName || !webhookId || !promptResult) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXECUTE_PROMPT_WEBHOOK',
        data: {
          recordId: id,
          promptName,
          webhookId,
          text: promptResult.result,
        },
      });

      if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('執行 Webhook 時出錯:', error);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setShowToast(true);
    });
  };

  if (!record || !promptName || !webhookResult) {
    return (
      <div className={`p-6 ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <p className="text-gray-500">找不到該筆記錄或 Webhook</p>
            <button
              onClick={() => navigate(`/history/${id}/prompt/${promptName}`)}
              className={`mt-4 px-4 py-2 rounded ${
                isLight ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-700 hover:bg-gray-600'
              }`}>
              返回提示詞詳情
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
            onClick={() => navigate(`/history/${id}/prompt/${promptName}`)}
            className={`mb-4 px-3 py-1 rounded text-sm ${
              isLight ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-700 hover:bg-gray-600'
            }`}>
            ← 返回
          </button>

          <div className={`p-6 rounded-lg ${isLight ? 'bg-white shadow-sm' : 'bg-gray-700'}`}>
            <div className="mb-4">
              <h1 className="text-2xl font-bold mb-2">{webhookResult.webhookName}</h1>
              {webhookConfig && (
                <div className="mb-4">
                  <h2 className="text-lg font-medium mb-2">Webhook 配置</h2>
                  <div className={`space-y-3 p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-gray-800'}`}>
                    <div className="font-medium">
                      <span className="text-blue-500">請求方法:</span> {webhookConfig.method}
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-blue-500">URL:</div>
                      <div
                        className={`font-mono text-sm p-3 rounded break-all ${
                          isLight ? 'bg-gray-100 text-gray-600' : 'bg-gray-700 text-gray-300'
                        }`}>
                        {webhookConfig.url}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className={`p-4 rounded-lg border ${getStatusColor(webhookResult.status || 'unexecuted')}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl" role="img" aria-label={webhookResult.status}>
                      {getStatusIcon(webhookResult.status)}
                    </span>
                    <span className="font-medium">{getStatusText(webhookResult.status)}</span>
                  </div>
                  {webhookResult.status !== 'processing' && (
                    <button
                      onClick={handleExecute}
                      className={`px-3 py-1 rounded text-sm ${
                        isLight ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
                      } hover:opacity-90`}>
                      重新執行
                    </button>
                  )}
                </div>
                {webhookResult.result && (
                  <div className="mt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-blue-500">執行結果:</div>
                      <button
                        onClick={() => handleCopy(webhookResult.result)}
                        className={`p-2 rounded-lg ${
                          isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-600'
                        } transition-colors`}
                        title="複製結果">
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
                    <div className="font-mono whitespace-pre-wrap">{webhookResult.result}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showToast && <Toast message="已複製到剪貼簿" onClose={() => setShowToast(false)} isLight={isLight} />}
    </div>
  );
};

export default PromptWebhookDetail;
