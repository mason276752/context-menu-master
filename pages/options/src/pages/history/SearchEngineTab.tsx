import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { searchSettingsStorage } from '@extension/storage/lib/search-settings';
import type { SearchEngine } from '@extension/storage/lib/search-settings';
import type { HistoryRecord } from '@extension/storage/lib/history-settings';

interface SearchEngineTabProps {
  record?: HistoryRecord;
  onSearch: (engine: SearchEngine) => void;
}

export const SearchEngineTab = ({ record, onSearch }: SearchEngineTabProps) => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const searchEngines = useStorage(searchSettingsStorage);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4">使用 AI 搜尋引擎</h3>
      <div className="grid gap-3">
        {searchEngines
          .filter(engine => engine.enabled)
          .map(engine => (
            <button
              key={engine.id}
              onClick={() => onSearch(engine)}
              className={`p-3 rounded-lg border flex items-center space-x-3 transition-colors ${
                isLight ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-600 hover:bg-gray-600'
              }`}>
              <span className="text-xl" role="img" aria-label={engine.name}>
                🔍
              </span>
              <div className="flex-1">
                <p className="font-medium">{engine.name}</p>
                <p className="text-sm text-gray-500 truncate">
                  {engine.queryTemplate?.replaceAll(/\{\{text\}\}/g, '...') || '直接搜尋'}
                </p>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
};
