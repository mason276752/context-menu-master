import type { WebhookConfig } from './webhook-settings.js';

export const executeWebhook = async (webhook: WebhookConfig, text: string, isJson: boolean): Promise<string> => {
  try {
    // 準備請求內容
    const headers = {
      ...webhook.headers,
      'Content-Type': 'application/json',
    };

    // 處理請求體
    let body = webhook.body || '';
    if (!isJson && body) {
      // 替換模板變數
      const now = new Date();
      body = body
        .replaceAll(/\{\{text\}\}/g, text)
        .replaceAll(/\{\{timestamp\}\}/g, now.toISOString())
        .replaceAll(/\{\{date\}\}/g, now.toLocaleDateString())
        .replaceAll(/\{\{time\}\}/g, now.toLocaleTimeString());
    } else {
      body = text;
    }
    let url = webhook.url;
    if (url.includes('{{text}}')) {
      url = url.replaceAll('{{text}}', text);
    }

    // 發送請求
    const response = await fetch(url, {
      method: webhook.method,
      headers,
      body: webhook.method === 'GET' || webhook.method === 'DELETE' ? undefined : body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // 嘗試解析回應
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const jsonResult = await response.json();
        return JSON.stringify(jsonResult, null, 2);
      }
    } catch {
      // 如果解析 JSON 失敗，返回原始文本
    }

    const result = await response.text();
    return result;
  } catch (error) {
    throw new Error(`Webhook 執行錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};
