import { useParams, useNavigate } from 'react-router';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { historyStorage } from '@extension/storage/lib/history-settings';
import { webhookSettingsStorage } from '@extension/storage/lib/webhook-settings';
import type { HistoryRecord } from '@extension/storage/lib/history-settings';
import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';
import { Toast } from '../Toast';

export const WebhookDetail = () => {
  const { id, webhookId } = useParams<{ id: string; webhookId: string }>();
  const navigate = useNavigate();
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const history = useStorage(historyStorage);
  const webhooks = useStorage(webhookSettingsStorage);
  const [showToast, setShowToast] = useState(false);

  const record = history.find((item: HistoryRecord) => item.id === id);
  const webhook = webhooks.find(w => w.id === webhookId);
  const webhookResult = record?.webhook?.[webhookId]?.[0];

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

  const handleExecute = async () => {
    if (!record || !webhookId || !webhook) return;

    try {
      // 調用 background script 執行
      const response = await chrome.runtime.sendMessage({
        type: 'EXECUTE_WEBHOOK',
        data: {
          recordId: id,
          webhookId: webhookId,
          text: record.text,
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

  if (!record || !webhookId || !webhook) {
    return (
      <div className={`p-6 ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <p className="text-gray-500">找不到該筆記錄或 Webhook</p>
            <button
              onClick={() => navigate(`/history/${id}`)}
              className={`mt-4 px-4 py-2 rounded ${
                isLight ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-700 hover:bg-gray-600'
              }`}>
              返回記錄詳情
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = webhookResult?.status || 'unexecuted';

  return (
    <div className={`p-6 ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/history/${id}`)}
            className={`mb-4 px-3 py-1 rounded text-sm ${
              isLight ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-700 hover:bg-gray-600'
            }`}>
            ← 返回
          </button>

          <div className={`p-6 rounded-lg ${isLight ? 'bg-white shadow-sm' : 'bg-gray-700'}`}>
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Webhook 配置</h2>
              <div className={`space-y-3 p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-gray-800'}`}>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-2 text-blue-500 font-medium overflow-scroll">URL:</div>
                  <div className="col-span-10 text-left font-medium break-all">{webhook.url}</div>
                  <div className="col-span-2 text-blue-500 font-medium">Method:</div>
                  <div className="col-span-10 text-left overflow-scroll font-medium">{webhook.method}</div>
                </div>
                {Object.keys(webhook.headers).length > 0 && (
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-2 text-blue-500 font-medium">Headers:</div>
                    <div className="col-span-10 text-left overflow-scroll">
                      <pre
                        className={`text-sm p-3 rounded font-mono ${
                          isLight ? 'bg-gray-100 text-gray-600' : 'bg-gray-700 text-gray-300'
                        }`}>
                        {JSON.stringify(webhook.headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                {webhook.body && (
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-2 text-blue-500 font-medium">Body:</div>
                    <div className="col-span-10 text-left">
                      <pre
                        className={`text-sm p-3 rounded font-mono ${
                          isLight ? 'bg-gray-100 text-gray-600' : 'bg-gray-700 text-gray-300'
                        }`}>
                        {webhook.body}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">{webhook.name}</h2>
              <div className={`p-4 rounded-lg border ${getStatusColor(status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl" role="img" aria-label={status}>
                      {getStatusIcon(status)}
                    </span>
                    <span className="font-medium">{getStatusText(status)}</span>
                  </div>
                  {status !== 'processing' && (
                    <button
                      onClick={handleExecute}
                      className={`px-3 py-1 rounded text-sm ${
                        isLight ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
                      } hover:opacity-90`}>
                      {status === 'unexecuted' ? '執行' : '重新執行'}
                    </button>
                  )}
                </div>
                {webhookResult?.result && (
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

export default WebhookDetail;
