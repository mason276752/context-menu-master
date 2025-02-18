import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { historyLimitStorage, historyStorage } from '@extension/storage/lib/history-settings';

const HistorySettings = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const historyLimit = useStorage(historyLimitStorage);
  const history = useStorage(historyStorage);

  const handleLimitChange = async (value: number) => {
    await historyLimitStorage.set(value);

    // 如果新的限制小於目前的記錄數量，則裁切歷史記錄
    if (value < history.length) {
      const updatedHistory = history.slice(0, value);
      await historyStorage.set(updatedHistory);
    }
  };

  const limitOptions = [
    { value: 10, label: '10 筆' },
    { value: 20, label: '20 筆' },
    { value: 30, label: '30 筆' },
    { value: 50, label: '50 筆' },
    { value: 100, label: '100 筆' },
  ];

  return (
    <div className="max-w-2xl">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">歷史記錄設定</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="history-limit" className="block text-sm font-medium mb-2">
                保留記錄數量
              </label>
              <select
                id="history-limit"
                value={historyLimit}
                onChange={e => handleLimitChange(Number(e.target.value))}
                className={`w-full max-w-xs rounded-md border ${
                  isLight ? 'border-gray-300 bg-white text-gray-900' : 'border-gray-600 bg-gray-700 text-gray-100'
                } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                {limitOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500">設定要保留的歷史記錄數量，超過限制的舊記錄將會自動刪除</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistorySettings;
