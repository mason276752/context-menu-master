import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';
import {
  aiSettingsStorage,
  aiPromptSettingsStorage,
  type AIConfig,
  type AIPrompt,
} from '@extension/storage/lib/ai-settings';
import { searchSettingsStorage, type SearchEngine } from '@extension/storage/lib/search-settings';
import {
  historyStorage,
  historyLimitStorage,
  type HistoryRecord,
  type HistoryWebhook,
} from '@extension/storage/lib/history-settings';
import { v4 as uuidv4 } from 'uuid';
import { callAIAPI } from '@extension/storage/lib/ai-api';
import { webhookSettingsStorage, type WebhookConfig } from '@extension/storage/lib/webhook-settings';
import { executeWebhook } from '@extension/storage/lib/webhook-api';
import { featureSettingsStorage } from '@extension/storage/lib/feature-settings';

// 創建右鍵選單
const createContextMenus = async (searchEngines: SearchEngine[], aiPrompts: AIPrompt[], webhooks: WebhookConfig[]) => {
  try {
    await chrome.contextMenus.removeAll();
    // 創建開啟設定選單
    await chrome.contextMenus.create({
      id: 'open-options',
      title: '開啟右鍵大師設定',
      contexts: ['selection'],
    });
    // 創建保存文字選單
    await chrome.contextMenus.create({
      id: 'save-text',
      title: '保存選取文字',
      contexts: ['selection'],
    });
    console.log('createContextMenus', searchEngines, aiPrompts, webhooks);

    const featureSettings = await featureSettingsStorage.get();
    const enabledWebhooks = featureSettings.webhook ? webhooks.filter(webhook => webhook.enabled) : [];
    const enabledEngines = searchEngines.filter(engine => engine.enabled);
    const enabledPrompts = featureSettings.aiAssistant ? aiPrompts.filter(prompt => prompt.enabled) : [];
    const settings = await aiSettingsStorage.get();

    if (enabledEngines.length > 0 || enabledPrompts.length > 0 || enabledWebhooks.length > 0) {
      // 創建 AI 搜尋選單
      if (enabledEngines.length > 0) {
        if (featureSettings.contextMenuParent) {
          await chrome.contextMenus.create({
            id: 'search-parent',
            title: 'AI 搜尋',
            contexts: ['selection'],
          });
        } else {
          await chrome.contextMenus.create({
            id: 'search-parent',
            type: 'separator',
            contexts: ['selection'],
          });
        }

        for (const engine of enabledEngines) {
          try {
            await chrome.contextMenus.create({
              id: `search-${engine.id}`,
              parentId: featureSettings.contextMenuParent ? 'search-parent' : undefined,
              title: engine.name,
              contexts: ['selection'],
            });
          } catch (error) {
            console.error(`創建搜尋選單失敗: ${engine.name}`, error);
          }
        }
      }

      // 創建 AI 助手選單
      if (enabledPrompts.length > 0) {
        if (featureSettings.contextMenuParent) {
          await chrome.contextMenus.create({
            id: 'ai-parent',
            title: 'AI 助手',
            contexts: ['selection'],
          });
        } else {
          await chrome.contextMenus.create({
            id: 'ai-parent',
            type: 'separator',
            contexts: ['selection'],
          });
        }

        for (const prompt of enabledPrompts) {
          try {
            const config = settings.find(s => s.id === prompt.aiConfigId);
            const title = config?.apiKey ? prompt.name : `${prompt.name} (請先設定 ${prompt.provider} API Key)`;

            await chrome.contextMenus.create({
              id: `ai-${prompt.name}`,
              parentId: featureSettings.contextMenuParent ? 'ai-parent' : undefined,
              title,
              contexts: ['selection'],
            });
          } catch (error) {
            console.error(`創建 AI 助手選單失敗: ${prompt.name}`, error);
          }
        }
      }

      // 創建 Webhook 選單
      if (enabledWebhooks.length > 0) {
        if (featureSettings.contextMenuParent) {
          await chrome.contextMenus.create({
            id: 'webhook-parent',
            title: 'Webhook',
            contexts: ['selection'],
          });
        } else {
          await chrome.contextMenus.create({
            id: 'webhook-parent',
            type: 'separator',
            contexts: ['selection'],
          });
        }

        for (const webhook of enabledWebhooks) {
          try {
            await chrome.contextMenus.create({
              id: `webhook-${webhook.id}`,
              parentId: featureSettings.contextMenuParent ? 'webhook-parent' : undefined,
              title: webhook.name,
              contexts: ['selection'],
            });
          } catch (error) {
            console.error(`創建 Webhook 選單項目失敗: ${webhook.name}`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('創建右鍵選單時出錯:', error);
    await chrome.contextMenus.removeAll();
  }
};

// 處理右鍵選單點擊事件
const handleContextMenuClick = async (
  info: chrome.contextMenus.OnClickData,
  searchEngines: SearchEngine[],
  aiPrompts: AIPrompt[],
  aiConfigs: AIConfig[],
) => {
  const historyLimit = await historyLimitStorage.get();
  const webhooks = await webhookSettingsStorage.get();
  const enabledWebhooks = webhooks.filter(webhook => webhook.enabled);

  if (info.menuItemId === 'save-text') {
    if (info.selectionText) {
      const newRecord: HistoryRecord = {
        id: uuidv4(),
        text: info.selectionText,
        timestamp: Date.now(),
        url: info.pageUrl,
      };

      const currentHistory = await historyStorage.get();
      const updatedHistory = [newRecord, ...currentHistory].slice(0, historyLimit);
      await historyStorage.set(updatedHistory);
      return;
    }
  } else if (info.menuItemId.toString().startsWith('search-')) {
    // 處理搜尋引擎選單點擊
    const engineId = info.menuItemId.toString().replace('search-', '');
    const engine = searchEngines.find(e => e.id === engineId);

    if (engine && info.selectionText) {
      // 處理查詢模板
      const query = engine.queryTemplate
        ? engine.queryTemplate.replaceAll(/\{\{text\}\}/g, info.selectionText)
        : info.selectionText;

      // 構建搜尋 URL
      const searchUrl = engine.url.replaceAll('%s', encodeURIComponent(query));

      // 在新標籤頁中打開搜尋結果
      chrome.tabs.create({ url: searchUrl });
      if (info.selectionText) {
        const newRecord: HistoryRecord = {
          id: uuidv4(),
          text: info.selectionText,
          timestamp: Date.now(),
          url: info.pageUrl,
        };

        const currentHistory = await historyStorage.get();
        const updatedHistory = [newRecord, ...currentHistory].slice(0, historyLimit);
        await historyStorage.set(updatedHistory);
        return;
      }
    }
  } else if (info.menuItemId.toString().startsWith('ai-')) {
    const promptName = info.menuItemId.toString().replace('ai-', '');
    const prompt = aiPrompts.find(p => p.name === promptName);

    if (prompt && info.selectionText) {
      try {
        const newRecord: HistoryRecord = {
          id: uuidv4(),
          text: info.selectionText,
          timestamp: Date.now(),
          url: info.pageUrl,
          prompt: {
            [prompt.name]: {
              id: uuidv4(),
              status: 'processing',
              promptName: prompt.name,
              result: '',
            },
          },
        };
        const currentHistory = await historyStorage.get();
        const updatedHistory = [newRecord, ...currentHistory].slice(0, historyLimit);
        await historyStorage.set(updatedHistory);

        const config = aiConfigs.find(c => c.provider === prompt.provider && c.model === prompt.model);
        if (!config || (!config.apiKey && config.provider !== 'Ollama')) {
          throw new Error(`未設定 ${prompt.provider} 的 API 金鑰`);
        }

        const processedPrompt = prompt.prompt.replaceAll(/\{\{text\}\}/g, info.selectionText);
        console.log('processedPrompt', processedPrompt);
        // 儲存到歷史記錄
        callAIAPI(config, processedPrompt, prompt.responseFormat)
          .then(async result => {
            const currentHistory = await historyStorage.get();
            currentHistory[0].prompt[prompt.name].status = 'success';
            currentHistory[0].prompt[prompt.name].result = result;

            // 如果有關聯的 webhook，執行 webhook
            if (prompt.webhookId) {
              const webhook = webhooks.find(w => w.id === prompt.webhookId);
              if (webhook && (webhook.method === 'POST' || webhook.method === 'PUT')) {
                try {
                  const webhookResult = await executeWebhook(webhook, result, !!prompt.responseFormat);
                  currentHistory[0].prompt[prompt.name].webhook = {
                    id: uuidv4(),
                    status: 'success',
                    webhookId: webhook.id,
                    webhookName: webhook.name,
                    result: webhookResult,
                  };
                } catch (error) {
                  currentHistory[0].prompt[prompt.name].webhook = {
                    id: uuidv4(),
                    status: 'error',
                    webhookId: webhook.id,
                    webhookName: webhook.name,
                    result: error instanceof Error ? error.message : '執行時發生錯誤',
                  };
                }
              }
            }

            await historyStorage.set(currentHistory);
          })
          .catch(async error => {
            const currentHistory = await historyStorage.get();
            currentHistory[0].prompt[prompt.name].status = 'error';
            currentHistory[0].prompt[prompt.name].result = error.toString();

            await historyStorage.set(currentHistory);
          });
      } catch (error) {
        const currentHistory = await historyStorage.get();
        currentHistory[0].prompt[prompt.name].status = 'error';
        currentHistory[0].prompt[prompt.name].result = error.toString();
        await historyStorage.set(currentHistory);
      }
    }
  } else if (info.menuItemId.toString().startsWith('webhook-')) {
    const webhookId = info.menuItemId.toString().replace('webhook-', '');
    const webhook = enabledWebhooks.find(w => w.id === webhookId);

    if (webhook && info.selectionText) {
      try {
        const newRecord: HistoryRecord = {
          id: uuidv4(),
          text: info.selectionText,
          timestamp: Date.now(),
          url: info.pageUrl,
          webhook: {
            [webhook.id]: [
              {
                status: 'processing',
                id: uuidv4(),
                webhookId: webhook.id,
                webhookName: webhook.name,
                result: '',
              },
            ],
          },
        };

        const currentHistory = await historyStorage.get();
        const updatedHistory = [newRecord, ...currentHistory].slice(0, historyLimit);
        await historyStorage.set(updatedHistory);

        // 執行 webhook
        const result = await executeWebhook(webhook, info.selectionText, false);

        // 更新歷史記錄
        const latestHistory = await historyStorage.get();
        if (latestHistory[0].webhook?.[webhook.id]) {
          latestHistory[0].webhook[webhook.id][0].result = result;
          latestHistory[0].webhook[webhook.id][0].status = 'success';
          await historyStorage.set(latestHistory);
        }
      } catch (error) {
        console.error('Webhook 執行錯誤:', error);
        const latestHistory = await historyStorage.get();
        if (latestHistory[0].webhook?.[webhook.id]) {
          latestHistory[0].webhook[webhook.id][0].result = error instanceof Error ? error.message : '執行時發生錯誤';
          latestHistory[0].webhook[webhook.id][0].status = 'error';
          await historyStorage.set(latestHistory);
        }
      }
    }
  } else if (info.menuItemId === 'open-options') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('/options/index.html#/setting/general'),
    });
  }
};

// 監聽擴展安裝事件
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await exampleThemeStorage.set('dark');
    try {
      // 設定預設功能狀態為關閉
      await featureSettingsStorage.set({
        webhook: false,
        aiAssistant: false,
      });

      // 預設的 Webhook 配置
      const defaultWebhooks: WebhookConfig[] = [
        {
          id: uuidv4(),
          name: 'POST - Test Webhook',
          url: 'http://localhost:5678/webhook-test/n8n',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: '{ "test": "{{text}}" }',
          enabled: true,
        },
        {
          id: uuidv4(),
          name: 'GET - Test Webhook',
          url: 'http://localhost:5678/webhook-test/n8n?text={{text}}',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          enabled: true,
        },
      ];
      // 初始化默認的搜索引擎設置
      const defaultSearchEngines: SearchEngine[] = [
        {
          id: 'chatgpt',
          name: 'ChatGPT - 5W2H 說明',
          url: 'https://chatgpt.com/?hints=search&q=%s',
          enabled: true,
          queryTemplate: '請以5W2H詳細說明{{text}}',
        },
        {
          id: 'grok',
          name: 'Grok - 正反面分析',
          url: 'https://grok.com/?q=%s',
          enabled: true,
          queryTemplate: '請以正反面分析：\n{{text}}',
        },
        {
          id: 'perplexity',
          name: 'Perplexity AI搜尋相關結果',
          url: 'https://www.perplexity.ai/?q=%s&hl=zh-TW&copilot=true',
          enabled: true,
          queryTemplate: '幫我搜尋{{text}}相關資訊',
        },
        {
          id: 'felo',
          name: 'Felo AI搜尋最新結果',
          url: 'https://felo.ai/search?q=%s',
          enabled: true,
          queryTemplate: '給我{{text}}的最新資訊',
        },
      ];

      // 初始化默認的 AI 設置
      const defaultAIConfigs: AIConfig[] = [
        {
          id: 'openai',
          provider: 'OpenAI',
          apiEndpoint: 'https://api.openai.com/v1',
          apiKey: '',
          model: 'gpt-4o',
          maxTokens: 4096,
        },
        {
          id: 'groq',
          provider: 'Groq',
          apiEndpoint: 'https://api.groq.com/openai/v1',
          apiKey: '',
          model: 'deepseek-r1-distill-llama-70b',
          maxTokens: 4096,
        },
        {
          id: 'gemini',
          provider: 'Gemini',
          apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
          apiKey: '',
          model: 'gemini-2.0-flash',
          maxTokens: 4096,
        },
        {
          id: 'grok',
          provider: 'Grok',
          apiEndpoint: 'https://api.x.ai/v1',
          apiKey: '',
          model: 'grok-3-latest',
          maxTokens: 2048,
        },
        {
          id: 'anthropic',
          provider: 'Anthropic',
          apiEndpoint: 'https://api.anthropic.com/v1/messages',
          apiKey: '',
          model: 'claude-3-opus-latest',
          maxTokens: 50000,
        },
        {
          id: 'ollama',
          provider: 'Ollama',
          apiEndpoint: 'http://localhost:11434',
          apiKey: '',
          model: 'llama3.1:8b',
          maxTokens: 2048,
        },
      ];
      // 初始化默認的 AI 提示詞
      const defaultPrompts: AIPrompt[] = [
        {
          id: 'summary',
          name: '摘要總結',
          prompt: '請幫我總結以下內容的重點：\n{{text}}',
          enabled: true,
          aiConfigId: 'openai',
          provider: 'OpenAI',
          model: 'gpt-4o',
          webhookId: defaultWebhooks[0].id,
        },
        {
          id: 'translate',
          name: '將內容翻譯成繁體中文',
          prompt: '請將以下文字用通俗語言翻譯成繁體中文：\n{{text}}',
          enabled: true,
          aiConfigId: 'gemini',
          provider: 'Gemini',
          model: 'gemini-2.0-flash',
          responseFormat: `{
  "type": "object",
  "properties": {
    "source_language_content": {
      "type": "string"
    },
    "target_language_content": {
      "type": "string"
    }
  },
  "required": [
    "source_language_content",
    "target_language_content"
  ]
}`,
          webhookId: defaultWebhooks[0].id,
        },
        {
          id: 'rewrite',
          name: '文章再製',
          prompt: '請將以下文章再製成一篇新的文章：\n{{text}}',
          enabled: true,
          aiConfigId: 'groq',
          provider: 'Groq',
          model: 'deepseek-r1-distill-llama-70b',
          webhookId: defaultWebhooks[0].id,
        },
      ];

      // 獲取當前設置
      const currentWebhooks = await webhookSettingsStorage.get();
      const currentAIConfigs = await aiSettingsStorage.get();
      const currentSearchEngines = await searchSettingsStorage.get();
      const currentPrompts = await aiPromptSettingsStorage.get();

      // 如果沒有 AI 設置，添加默認設置
      if (!currentAIConfigs || currentAIConfigs.length === 0) {
        await aiSettingsStorage.set(defaultAIConfigs);
        console.log('已添加默認 AI 設置');
      }

      // 如果沒有提示詞設置，添加默認設置
      if (!currentPrompts || currentPrompts.length === 0) {
        await aiPromptSettingsStorage.set(defaultPrompts);
        console.log('已添加默認提示詞設置');
      }

      // 如果沒有搜索引擎設置，添加默認設置
      if (!currentSearchEngines || currentSearchEngines.length === 0) {
        await searchSettingsStorage.set(defaultSearchEngines);
        console.log('已添加默認搜索引擎設置');
      }

      if (!currentWebhooks || currentWebhooks.length === 0) {
        await webhookSettingsStorage.set(defaultWebhooks);
        console.log('已添加默認Webhook設置');
      }

      // 安裝完成後開啟選項頁面，並導向功能設定頁面
      chrome.tabs.create({
        url: chrome.runtime.getURL('/options/index.html#'),
      });
    } catch (error) {
      console.error('初始化設置時出錯:', error);
    }
  }
  // 初始化右鍵選單
  const [currentSearchEngines, currentPrompts, currentWebhooks] = await Promise.all([
    searchSettingsStorage.get(),
    aiPromptSettingsStorage.get(),
    webhookSettingsStorage.get(),
  ]);

  if (Array.isArray(currentSearchEngines) && Array.isArray(currentPrompts) && Array.isArray(currentWebhooks)) {
    await createContextMenus(currentSearchEngines, currentPrompts, currentWebhooks);
  }
});

// 監聽設置變更
const updateContextMenus = async () => {
  try {
    const [searchEngines, aiPrompts, webhooks] = await Promise.all([
      searchSettingsStorage.get(),
      aiPromptSettingsStorage.get(),
      webhookSettingsStorage.get(),
    ]);

    if (Array.isArray(searchEngines) && Array.isArray(aiPrompts) && Array.isArray(webhooks)) {
      console.log('updateContextMenus', searchEngines, aiPrompts, webhooks);
      await createContextMenus(searchEngines, aiPrompts, webhooks);
    }
  } catch (error) {
    console.error('更新右鍵選單時出錯:', error);
  }
};
featureSettingsStorage.subscribe(updateContextMenus);
aiSettingsStorage.subscribe(updateContextMenus);
searchSettingsStorage.subscribe(updateContextMenus);
aiPromptSettingsStorage.subscribe(updateContextMenus);
webhookSettingsStorage.subscribe(updateContextMenus);

// 監聽右鍵選單點擊
chrome.contextMenus.onClicked.addListener(async info => {
  const [searchEngines, aiPrompts, aiConfigs] = await Promise.all([
    searchSettingsStorage.get(),
    aiPromptSettingsStorage.get(),
    aiSettingsStorage.get(),
  ]);

  if (Array.isArray(searchEngines) && Array.isArray(aiPrompts) && Array.isArray(aiConfigs)) {
    handleContextMenuClick(info, searchEngines, aiPrompts, aiConfigs);
  }
});

// 初始化主題
exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

// 添加新的消息處理器
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXECUTE_PROMPT') {
    handlePromptExecution(message.data)
      .then(sendResponse)
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true; // 表示會異步發送回應
  }
  if (message.type === 'EXECUTE_WEBHOOK') {
    handleWebhookExecution(message.data)
      .then(sendResponse)
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true;
  }
  if (message.type === 'EXECUTE_PROMPT_WEBHOOK') {
    handlePromptWebhookExecution(message.data)
      .then(sendResponse)
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true;
  }
});

// 處理提示詞執行的函數
async function handlePromptExecution(data: { recordId: string; promptName: string; text: string }) {
  const [history, aiPrompts, aiConfigs, webhooks] = await Promise.all([
    historyStorage.get(),
    aiPromptSettingsStorage.get(),
    aiSettingsStorage.get(),
    webhookSettingsStorage.get(),
  ]);

  const recordIndex = history.findIndex(item => item.id === data.recordId);
  if (recordIndex === -1) {
    throw new Error('找不到記錄');
  }
  try {
    const prompt = aiPrompts.find(p => p.name === data.promptName);
    if (!prompt) {
      throw new Error('找不到提示詞配置');
    }
    // 檢查是否有關聯的 webhook
    const webhook = prompt.webhookId ? webhooks.find(w => w.id === prompt.webhookId) : undefined;

    const config = aiConfigs.find(c => c.provider === prompt.provider && c.model === prompt.model);
    if (!config || (!config.apiKey && config.provider !== 'Ollama')) {
      throw new Error(`未設定 ${prompt.provider} 的 API 金鑰`);
    }

    // 確保 prompt 對象存在
    if (!history[recordIndex].prompt) {
      history[recordIndex].prompt = {};
    }
    // 更新狀態為處理中
    history[recordIndex].prompt[data.promptName] = {
      id: uuidv4(),
      status: 'processing',
      promptName: data.promptName,
      result: '',
    };
    await historyStorage.set(history);

    // 處理提示詞模板
    const processedPrompt = prompt.prompt.replaceAll(/\{\{text\}\}/g, data.text);
    console.log('processedPrompt', processedPrompt);
    // 調用 AI API
    const result = await callAIAPI(config, processedPrompt, prompt.responseFormat);

    // 如果有關聯的 webhook 且為 POST 方法，執行 webhook
    let webhookResult: HistoryWebhook | undefined = undefined;
    if (webhook && (webhook.method === 'POST' || webhook.method === 'PUT')) {
      try {
        const _webhookResult = await executeWebhook(webhook, result, !!prompt.responseFormat);
        webhookResult = {
          id: uuidv4(),
          status: 'success',
          webhookId: webhook.id,
          webhookName: webhook.name,
          result: _webhookResult,
        };
      } catch (error) {
        webhookResult = {
          id: uuidv4(),
          status: 'error',
          webhookId: webhook.id,
          webhookName: webhook.name,
          result: error.message,
        };
      }
    }
    console.log('webhookResult', webhookResult);

    // 更新成功狀態
    const currentHistory = await historyStorage.get();
    if (!currentHistory[recordIndex].prompt) {
      currentHistory[recordIndex].prompt = {};
    }
    currentHistory[recordIndex].prompt[data.promptName] = {
      id: uuidv4(),
      status: 'success',
      promptName: data.promptName,
      result: result,
      webhook: webhook ? webhookResult : undefined,
    };
    await historyStorage.set(currentHistory);

    return { success: true };
  } catch (error) {
    // 更新錯誤狀態
    const currentHistory = await historyStorage.get();
    if (!currentHistory[recordIndex].prompt) {
      currentHistory[recordIndex].prompt = {};
    }
    currentHistory[recordIndex].prompt[data.promptName] = {
      id: uuidv4(),
      status: 'error',
      promptName: data.promptName,
      result: error instanceof Error ? error.message : '執行時發生錯誤',
    };
    await historyStorage.set(currentHistory);

    throw error;
  }
}

// 處理 webhook 執行的函數
async function handleWebhookExecution(data: { recordId: string; webhookId: string; text: string }) {
  const [history, webhooks] = await Promise.all([historyStorage.get(), webhookSettingsStorage.get()]);

  const recordIndex = history.findIndex(item => item.id === data.recordId);
  if (recordIndex === -1) {
    throw new Error('找不到記錄');
  }

  const webhook = webhooks.find(w => w.id === data.webhookId);
  if (!webhook) {
    throw new Error('找不到 Webhook 配置');
  }

  try {
    // 確保 webhook 對象存在
    if (!history[recordIndex].webhook) {
      history[recordIndex].webhook = {};
    }
    // 更新狀態為處理中
    history[recordIndex].webhook[data.webhookId] = [
      {
        id: uuidv4(),
        status: 'processing',
        webhookId: data.webhookId,
        webhookName: webhook.name,
        result: '',
      },
    ];
    await historyStorage.set(history);

    // 執行 webhook
    const result = await executeWebhook(webhook, data.text, false);

    // 更新成功狀態
    const currentHistory = await historyStorage.get();
    if (!currentHistory[recordIndex].webhook) {
      currentHistory[recordIndex].webhook = {};
    }
    currentHistory[recordIndex].webhook[data.webhookId] = [
      {
        id: uuidv4(),
        status: 'success',
        webhookId: data.webhookId,
        webhookName: webhook.name,
        result: result,
      },
    ];
    await historyStorage.set(currentHistory);

    return { success: true };
  } catch (error) {
    // 更新錯誤狀態
    const currentHistory = await historyStorage.get();
    if (!currentHistory[recordIndex].webhook) {
      currentHistory[recordIndex].webhook = {};
    }
    currentHistory[recordIndex].webhook[data.webhookId] = [
      {
        id: uuidv4(),
        status: 'error',
        webhookId: data.webhookId,
        webhookName: webhook.name,
        result: error instanceof Error ? error.message : '執行時發生錯誤',
      },
    ];
    await historyStorage.set(currentHistory);

    throw error;
  }
}

// 處理 prompt webhook 執行的函數
async function handlePromptWebhookExecution(data: {
  recordId: string;
  promptName: string;
  webhookId: string;
  text: string;
}) {
  const [history, webhooks, aiPrompts] = await Promise.all([
    historyStorage.get(),
    webhookSettingsStorage.get(),
    aiPromptSettingsStorage.get(),
  ]);

  const recordIndex = history.findIndex(item => item.id === data.recordId);
  if (recordIndex === -1) {
    throw new Error('找不到記錄');
  }

  const webhook = webhooks.find(w => w.id === data.webhookId);
  if (!webhook) {
    throw new Error('找不到 Webhook 配置');
  }

  try {
    // 確保 prompt 對象存在
    if (!history[recordIndex].prompt) {
      history[recordIndex].prompt = {};
    }
    if (!history[recordIndex].prompt[data.promptName]) {
      throw new Error('找不到提示詞執行記錄');
    }

    const prompt = aiPrompts.find(p => p.name === data.promptName);
    if (!prompt) {
      throw new Error('找不到提示詞配置');
    }

    // 更新狀態為處理中
    history[recordIndex].prompt[data.promptName].webhook = {
      id: data.webhookId,
      status: 'processing',
      webhookId: data.webhookId,
      webhookName: webhook.name,
      result: '',
    };
    await historyStorage.set(history);

    // 執行 webhook
    let webhookResult: HistoryWebhook | undefined = undefined;
    try {
      const _webhookResult = await executeWebhook(webhook, data.text, !!prompt.responseFormat);
      webhookResult = {
        id: data.webhookId,
        status: 'success',
        webhookId: data.webhookId,
        webhookName: webhook.name,
        result: _webhookResult,
      };
    } catch (error) {
      webhookResult = {
        id: data.webhookId,
        status: 'error',
        webhookId: data.webhookId,
        webhookName: webhook.name,
        result: error.message,
      };
    }

    // 更新成功狀態
    const currentHistory = await historyStorage.get();
    if (!currentHistory[recordIndex].prompt?.[data.promptName]) {
      throw new Error('找不到提示詞執行記錄');
    }

    currentHistory[recordIndex].prompt[data.promptName].webhook = webhookResult;
    await historyStorage.set(currentHistory);

    return { success: true };
  } catch (error) {
    // 更新錯誤狀態
    const currentHistory = await historyStorage.get();
    if (!currentHistory[recordIndex].prompt?.[data.promptName]) {
      throw new Error('找不到提示詞執行記錄');
    }

    currentHistory[recordIndex].prompt[data.promptName].webhook = {
      id: data.webhookId,
      status: 'error',
      webhookId: data.webhookId,
      webhookName: webhook.name,
      result: error instanceof Error ? error.message : '執行時發生錯誤',
    };
    await historyStorage.set(currentHistory);

    throw error;
  }
}
