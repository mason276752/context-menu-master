import { createHashRouter, RouterProvider } from 'react-router';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import Main from './Main';
import Layout from './Layout';
import General from './pages/settings/General';
import Advanced from './pages/settings/Advanced';
import History from './pages/History';
import HistoryDetail from './pages/HistoryDetail';
import PromptDetail from './pages/history/PromptDetail';
import WebhookDetail from './pages/history/WebhookDetail';
import PromptWebhookDetail from './pages/history/PromptWebhookDetail';

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Main />,
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
      {
        path: '/setting',
        element: <General />,
      },
      {
        path: '/setting/general',
        element: <General />,
      },
      {
        path: '/setting/advanced',
        element: <Advanced />,
      },
      {
        path: '/nothing',
        element: <div>Nothing</div>,
      },
    ],
  },
]);

const Options = () => {
  return <RouterProvider router={router} />;
};

export default withErrorBoundary(withSuspense(Options, <div> Loading ... </div>), <div> Error Occur </div>);
