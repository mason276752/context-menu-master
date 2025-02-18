import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { ToggleButton } from '@extension/ui';
import { t } from '@extension/i18n';

const ThemeSettings = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">主題設定</h3>
      </div>

      <div className={`p-6 rounded-lg border ${!isLight && 'border-gray-700'} space-y-6`}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-medium">外觀主題</div>
            <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>選擇您喜歡的界面主題</div>
          </div>
          <ToggleButton onClick={exampleThemeStorage.toggle}>
            <div className="flex items-center space-x-2">
              <span>{t('toggleTheme')}</span>
              <span
                className={`text-sm px-3 py-1 rounded-full ${
                  isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-900 text-blue-100'
                }`}>
                {isLight ? '淺色' : '深色'}
              </span>
            </div>
          </ToggleButton>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <button
            type="button"
            onClick={() => exampleThemeStorage.set('light')}
            className={`p-4 rounded-lg border text-left transition-all duration-200 ${
              isLight ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500' : 'border-gray-600 hover:bg-gray-700'
            }`}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium text-lg">淺色主題</div>
                <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  適合日間使用，提供清晰的視覺體驗
                </div>
              </div>
              {isLight && <div className={`text-sm px-3 py-1 rounded-full ${'bg-blue-100 text-blue-800'}`}>使用中</div>}
            </div>
          </button>

          <button
            type="button"
            onClick={() => exampleThemeStorage.set('dark')}
            className={`p-4 rounded-lg border text-left transition-all duration-200 ${
              !isLight ? 'bg-blue-900 border-blue-400 ring-2 ring-blue-400' : 'border-gray-300 hover:bg-gray-50'
            }`}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium text-lg">深色主題</div>
                <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  適合夜間使用，減少眼睛疲勞
                </div>
              </div>
              {!isLight && (
                <div className={`text-sm px-3 py-1 rounded-full ${'bg-blue-100 text-blue-800'}`}>使用中</div>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
