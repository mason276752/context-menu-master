import { Link, Outlet, useLocation } from 'react-router';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { useState, useEffect } from 'react';

const Layout = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const location = useLocation();
  const [isSettingOpen, setIsSettingOpen] = useState(false);

  // 当路径包含 setting 时自动展开设置菜单
  useEffect(() => {
    setIsSettingOpen(location.pathname.includes('/setting'));
  }, [location.pathname]);

  return (
    <div className={`flex h-screen w-screen ${isLight ? 'bg-slate-50 text-gray-900' : 'bg-gray-800 text-gray-100'}`}>
      {/* 左侧边栏 */}
      <div className={`w-64 border-r ${isLight ? 'border-gray-200' : 'border-gray-700'} p-4`}>
        <nav className="space-y-2">
          <Link
            to="/"
            className={`block p-2 rounded hover:bg-opacity-20 ${
              location.pathname === '/' ? (isLight ? 'bg-gray-200' : 'bg-gray-700') : ''
            } ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`}>
            主頁
          </Link>

          <Link
            to="/history"
            className={`block p-2 rounded hover:bg-opacity-20 ${
              location.pathname === '/history' ? (isLight ? 'bg-gray-200' : 'bg-gray-700') : ''
            } ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`}>
            歷史記錄
          </Link>

          {/* 设置菜单 */}
          <div>
            <button
              onClick={() => setIsSettingOpen(!isSettingOpen)}
              className={`w-full text-left p-2 rounded hover:bg-opacity-20 flex items-center justify-between ${
                location.pathname.includes('/setting') ? (isLight ? 'bg-gray-200' : 'bg-gray-700') : ''
              } ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`}>
              <span>設定</span>
              <span className={`transform transition-transform ${isSettingOpen ? 'rotate-90' : ''}`}>▶</span>
            </button>

            {isSettingOpen && (
              <div className="pl-4 space-y-2 mt-2">
                <Link
                  to="/setting/general"
                  className={`block p-2 rounded hover:bg-opacity-20 ${
                    location.pathname.includes('/general') ? (isLight ? 'bg-gray-200' : 'bg-gray-700') : ''
                  } ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`}>
                  一般設定
                </Link>
                <Link
                  to="/setting/advanced"
                  className={`block p-2 rounded hover:bg-opacity-20 ${
                    location.pathname.includes('/advanced') ? (isLight ? 'bg-gray-200' : 'bg-gray-700') : ''
                  } ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`}>
                  進階設定
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
