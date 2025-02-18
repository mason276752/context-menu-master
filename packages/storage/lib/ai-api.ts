import { aiSettingsStorage, aiPromptSettingsStorage, type AIConfig } from './ai-settings.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { Ollama } from 'ollama/browser';

export const callAIAPI = async (config: AIConfig, prompt: string, responseFormat?: string): Promise<string> => {
  const url = config.apiEndpoint;

  const jsonObject = responseFormat
    ? {
        type: 'json_object',
        json_schema: JSON.parse(responseFormat),
      }
    : undefined;

  // 根據不同提供商設置 Authorization header
  let client: any;
  switch (config.provider) {
    case 'OpenAI':
    case 'Groq':
    case 'Grok':
      client = new OpenAI({
        baseURL: url,
        apiKey: config.apiKey,
      });
      break;
    case 'Anthropic':
      client = new Anthropic({
        baseURL: url,
        apiKey: config.apiKey,
      });
      break;
    case 'Gemini':
      const generationConfig = responseFormat
        ? {
            responseMimeType: 'application/json',
            responseSchema: JSON.parse(responseFormat),
          }
        : undefined;

      const gem = new GoogleGenerativeAI(config.apiKey);
      client = gem.getGenerativeModel({ model: config.model, generationConfig });
      break;
    case 'Ollama':
      client = new Ollama({
        host: url,
      });
      break;
    default:
      client = new OpenAI({
        baseURL: url,
        apiKey: config.apiKey,
      });
  }

  // 根據不同提供商構建請求體
  let body: any;
  const messages = [{ role: 'user', content: prompt }];
  switch (config.provider) {
    case 'OpenAI':
    case 'Groq':
    case 'Grok':
      responseFormat && messages.push({ role: 'system', content: 'json:' + responseFormat });
      body = await client.chat.completions.create({
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        response_format: jsonObject,
      });
      break;
    case 'Anthropic':
      // not support response_format
      body = await client.messages.create({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        response_format: jsonObject,
      });
      break;
    case 'Gemini':
      body = await client.generateContent(prompt);
      break;
    case 'Ollama':
      body = await client.chat({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        format: responseFormat ? JSON.parse(responseFormat) : undefined,
      });
      break;
    default:
      responseFormat && messages.push({ role: 'system', content: 'json:' + responseFormat });
      body = await client.chat.completions.create({
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        response_format: jsonObject,
      });
  }
  console.log('body', body);
  try {
    // 根據不同提供商解析回應
    switch (config.provider) {
      case 'OpenAI':
      case 'Groq':
      case 'Grok':
        return body.choices[0].message.content;
      case 'Anthropic':
        return body.content[0].text;
      case 'Gemini':
        return body.response.candidates[0].content.parts[0].text;
      case 'Ollama':
        return body.message.content;
      default:
        if (body.choices[0].message.content) {
          return body.choices[0].message.content;
        }
        throw new Error('無法解析 AI 回應');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`AI API 錯誤: ${error.message}`);
    }
    throw new Error('未知的 AI API 錯誤');
  }
};
