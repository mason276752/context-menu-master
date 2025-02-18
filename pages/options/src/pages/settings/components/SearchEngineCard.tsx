import { useState } from 'react';
import { type SearchEngine } from '@extension/storage/lib/search-settings';

interface SearchEngineCardProps {
  engine: SearchEngine;
  index: number;
  isLight: boolean;
  onEdit: (engine: SearchEngine, index: number) => void;
  onDelete: (index: number) => void;
  onToggle: (index: number) => void;
  getPreviewUrl: (url: string, queryTemplate?: string, preview?: string) => string;
  isEditing: boolean;
  editingEngine: SearchEngine | null;
  onEditChange: (field: string, value: string) => void;
  onEditSave: (index: number) => void;
  onEditCancel: () => void;
  validateUrl: (url: string) => void;
  isValidUrl: boolean;
}

export const SearchEngineCard = ({
  engine,
  index,
  isLight,
  onEdit,
  onDelete,
  onToggle,
  getPreviewUrl,
  isEditing,
  editingEngine,
  onEditChange,
  onEditSave,
  onEditCancel,
  validateUrl,
  isValidUrl,
}: SearchEngineCardProps) => {
  const [localPreviewText, setLocalPreviewText] = useState('生成式AI');

  return (
    <div
      className={`p-4 rounded-lg border ${
        isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
      } hover:shadow-md transition-shadow duration-200`}>
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editingEngine?.name || ''}
            onChange={e => onEditChange('name', e.target.value)}
            placeholder="搜尋引擎名稱"
            className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
            }`}
          />
          <input
            type="text"
            value={editingEngine?.url || ''}
            onChange={e => {
              onEditChange('url', e.target.value);
              validateUrl(e.target.value);
            }}
            placeholder="搜尋 URL"
            className={`w-full p-2 rounded border focus:outline-none focus:ring-2 ${
              isValidUrl ? 'border-gray-300' : 'border-red-500'
            } ${!isLight && 'bg-gray-700 text-white'} ${isValidUrl ? 'focus:ring-blue-500' : 'focus:ring-red-500'}`}
          />
          {!isValidUrl && (
            <div className={`text-sm ${isLight ? 'text-red-500' : 'text-red-400'}`}>請輸入有效的 URL 格式</div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor={`queryTemplate-${index}`}>
              查詢文字模板
            </label>
            <textarea
              id={`queryTemplate-${index}`}
              value={editingEngine?.queryTemplate || ''}
              onChange={e => onEditChange('queryTemplate', e.target.value)}
              placeholder="例如：請問{{text}}是什麼"
              rows={3}
              className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
              }`}
            />
            <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              使用 {'{{text}}'} 作為替換文字，支援多行輸入，留空則直接使用搜尋文字
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor={`previewText-${index}`}>
              預覽文字
            </label>
            <input
              id={`previewText-${index}`}
              type="text"
              value={localPreviewText}
              onChange={e => setLocalPreviewText(e.target.value)}
              placeholder="輸入測試文字"
              className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLight ? 'border-gray-300' : 'border-gray-600 bg-gray-700 text-white'
              }`}
            />
          </div>
          {editingEngine?.url && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">預覽：</span>
                <a
                  href={getPreviewUrl(editingEngine.url, editingEngine.queryTemplate, localPreviewText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm ${
                    isLight ? 'text-blue-600 hover:text-blue-800' : 'text-blue-400 hover:text-blue-300'
                  } hover:underline`}>
                  點我測試
                </a>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onEditCancel}
              className={`px-3 py-1 rounded-full ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}>
              取消
            </button>
            <button
              type="button"
              onClick={() => onEditSave(index)}
              disabled={!editingEngine?.name || !editingEngine?.url || !isValidUrl}
              className={`px-3 py-1 rounded-full text-white ${
                !editingEngine?.name || !editingEngine?.url || !isValidUrl
                  ? `${isLight ? 'bg-gray-300' : 'bg-gray-600'} cursor-not-allowed`
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}>
              儲存
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-medium text-lg">{engine.name}</div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onToggle(index)}
                className={`text-sm px-3 py-1 rounded-full ${
                  engine.enabled
                    ? `${isLight ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-green-900 text-green-100 hover:bg-green-800'}`
                    : `${isLight ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`
                }`}>
                {engine.enabled ? '已啟用' : '已停用'}
              </button>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => onEdit(engine, index)}
                  className={`text-sm px-3 py-1 rounded-full ${
                    isLight
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      : 'bg-blue-900 text-blue-100 hover:bg-blue-800'
                  }`}>
                  修改
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(index)}
                  className={`text-sm px-3 py-1 rounded-full ${
                    isLight ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-900 text-red-100 hover:bg-red-800'
                  }`}>
                  刪除
                </button>
              </div>
            </div>
          </div>
          <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
            {engine.queryTemplate && (
              <div className="mb-1">
                <div className="font-medium mb-1">查詢模板:</div>
                <div className="whitespace-pre-wrap pl-2 border-l-2 border-gray-300 dark:border-gray-600">
                  {engine.queryTemplate}
                </div>
              </div>
            )}
            <div>URL: {engine.url}</div>
            <div className="mt-1">
              <div className="flex items-center space-x-2">
                <span>預覽：</span>
                <a
                  href={getPreviewUrl(engine.url, engine.queryTemplate, localPreviewText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${
                    isLight ? 'text-blue-600 hover:text-blue-800' : 'text-blue-400 hover:text-blue-300'
                  } hover:underline`}>
                  點我測試
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
