import '@src/Popup.css';
import { useStorage } from '@extension/shared';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { createHashRouter, RouterProvider } from 'react-router';
import History from './components/history/History';
import HistoryDetail from './components/history/HistoryDetail';
import PromptDetail from './components/history/PromptDetail';
import PromptWebhookDetail from './components/history/PromptWebhookDetail';
import WebhookDetail from './components/history/WebhookDetail';

const router = createHashRouter([
  {
    path: '/',
    element: <History />,
  },
  {
    path: '/history',
    element: <History />,
  },
  {
    path: '/history/:id',
    element: <HistoryDetail />,
  },
  {
    path: '/history/:id/prompt/:promptName',
    element: <PromptDetail />,
  },
  {
    path: '/history/:id/prompt/:promptName/webhook/:webhookId',
    element: <PromptWebhookDetail />,
  },
  {
    path: '/history/:id/webhook/:webhookId',
    element: <WebhookDetail />,
  },
]);

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  return (
    <div className={`flex h-screen w-screen ${isLight ? 'bg-slate-50 text-gray-900' : 'bg-gray-800 text-gray-100'}`}>
      <div className="flex-1 overflow-auto">
        <RouterProvider router={router} />
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
