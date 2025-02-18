import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { historyStorage, historyLimitStorage } from '@extension/storage/lib/history-settings';
import type { HistoryRecord } from '@extension/storage/lib/history-settings';
import { Link } from 'react-router';
import { useState } from 'react';
import { Toast } from '../Toast';

const History = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const history = useStorage(historyStorage);
  const historyLimit = useStorage(historyLimitStorage);
  const [showToast, setShowToast] = useState(false);
  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setShowToast(true);
    });
  };

  return (
    <div className={`p-6 ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">歷史記錄</h1>
            <button
              onClick={openOptions}
              className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-600'}`}
              title="開啟設定">
              <svg
                className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-gray-300'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
          <div className="text-sm text-gray-500 space-x-1">
            <span>共 {history.length} 筆記錄</span>
            <span>·</span>
            <span>最多 {historyLimit} 筆</span>
          </div>
        </div>

        <div className="space-y-3">
          {history.length === 0 ? (
            <div className={`p-4 rounded-lg ${isLight ? 'bg-white shadow-sm' : 'bg-gray-700'} text-center`}>
              <p className="text-gray-500">尚無歷史記錄</p>
            </div>
          ) : (
            history.map((record: HistoryRecord) => (
              <Link
                key={record.id}
                to={`/history/${record.id}`}
                className={`block p-4 rounded-lg ${
                  isLight ? 'bg-white shadow-sm hover:shadow' : 'bg-gray-700 hover:bg-gray-650'
                } transition-all duration-200`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium mb-1 break-words line-clamp-3">{record.text}</p>
                    <p className="text-sm text-gray-500 truncate">{record.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <time className="text-sm text-gray-500 whitespace-nowrap">{formatDate(record.timestamp)}</time>
                    <button
                      onClick={e => {
                        e.preventDefault();
                        handleCopy(record.text);
                      }}
                      className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600`}
                      title="複製文字">
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
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
      {showToast && <Toast message="已複製到剪貼簿" onClose={() => setShowToast(false)} isLight={isLight} />}
    </div>
  );
};

export default History;
