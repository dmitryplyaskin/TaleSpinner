import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  Stream,
} from "openai/resources/chat/completions";

export interface OpenRouterConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
  siteName?: string;
  siteUrl?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider: {
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

export interface OpenRouterChatOptions
  extends Omit<ChatCompletionCreateParams, "model"> {
  model?: string;
  provider?: {
    order?: string[];
    allow_fallbacks?: boolean;
  };
  transforms?: string[];
}

export interface OpenRouterStreamOptions extends OpenRouterChatOptions {
  stream: true;
}

export class OpenRouterAPI {
  private client: OpenAI;
  private config: Required<OpenRouterConfig>;

  constructor(config: OpenRouterConfig) {
    this.config = {
      baseURL: "https://openrouter.ai/api/v1",
      defaultModel: "openai/gpt-3.5-turbo",
      siteName: "",
      siteUrl: "",
      maxRetries: 3,
      timeout: 60000,
      ...config,
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      maxRetries: this.config.maxRetries,
      timeout: this.config.timeout,
      defaultHeaders: {
        "HTTP-Referer": this.config.siteUrl,
        "X-Title": this.config.siteName,
      },
    });
  }

  /**
   * Получить список доступных моделей
   */
  async getModels(): Promise<OpenRouterModelsResponse> {
    try {
      const response = await fetch(`${this.config.baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "HTTP-Referer": this.config.siteUrl,
          "X-Title": this.config.siteName,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to fetch models: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Создать чат completion
   */
  async createChatCompletion(
    messages: ChatCompletionMessageParam[],
    options: OpenRouterChatOptions = {}
  ): Promise<ChatCompletion> {
    const params: ChatCompletionCreateParams = {
      model: options.model || this.config.defaultModel,
      messages,
      ...options,
    };

    try {
      return await this.client.chat.completions.create(params);
    } catch (error) {
      throw new Error(
        `Chat completion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Создать стриминговый чат completion
   */
  async createStreamingChatCompletion(
    messages: ChatCompletionMessageParam[],
    options: Omit<OpenRouterStreamOptions, "stream"> = {}
  ): Promise<Stream<ChatCompletion.Choice>> {
    const params: ChatCompletionCreateParams = {
      model: options.model || this.config.defaultModel,
      messages,
      stream: true,
      ...options,
    };

    try {
      return await this.client.chat.completions.create(params);
    } catch (error) {
      throw new Error(
        `Streaming chat completion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Простой метод для отправки сообщения
   */
  async sendMessage(
    content: string,
    model?: string,
    options: Partial<ChatCompletionCreateParams> = {}
  ): Promise<string> {
    const messages: ChatCompletionMessageParam[] = [{ role: "user", content }];

    const completion = await this.createChatCompletion(messages, {
      model: model || this.config.defaultModel,
      ...options,
    });

    return completion.choices[0]?.message?.content || "";
  }

  /**
   * Метод для ведения диалога с контекстом
   */
  async continueConversation(
    messages: ChatCompletionMessageParam[],
    newMessage: string,
    model?: string,
    options: Partial<ChatCompletionCreateParams> = {}
  ): Promise<{
    response: string;
    updatedMessages: ChatCompletionMessageParam[];
    usage?: ChatCompletion.Usage;
  }> {
    const updatedMessages: ChatCompletionMessageParam[] = [
      ...messages,
      { role: "user", content: newMessage },
    ];

    const completion = await this.createChatCompletion(updatedMessages, {
      model: model || this.config.defaultModel,
      ...options,
    });

    const assistantMessage = completion.choices[0]?.message?.content || "";

    updatedMessages.push({
      role: "assistant",
      content: assistantMessage,
    });

    return {
      response: assistantMessage,
      updatedMessages,
      usage: completion.usage,
    };
  }

  /**
   * Получить информацию о балансе и лимитах
   */
  async getGenerationInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseURL}/auth/key`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "HTTP-Referer": this.config.siteUrl,
          "X-Title": this.config.siteName,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to fetch generation info: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Установить новую конфигурацию
   */
  updateConfig(newConfig: Partial<OpenRouterConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Пересоздаем клиент с новой конфигурацией
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      maxRetries: this.config.maxRetries,
      timeout: this.config.timeout,
      defaultHeaders: {
        "HTTP-Referer": this.config.siteUrl,
        "X-Title": this.config.siteName,
      },
    });
  }

  /**
   * Получить текущую конфигурацию
   */
  getConfig(): Required<OpenRouterConfig> {
    return { ...this.config };
  }
}

// Пример использования:
/*
const openRouter = new OpenRouterAPI({
  apiKey: 'your-openrouter-api-key',
  siteName: 'Your App Name',
  siteUrl: 'https://your-site.com',
  defaultModel: 'anthropic/claude-3-haiku'
});

// Простое сообщение
const response = await openRouter.sendMessage('Hello, how are you?');
console.log(response);

// Получить список моделей
const models = await openRouter.getModels();
console.log(models.data);

// Стриминговый чат
const stream = await openRouter.createStreamingChatCompletion([
  { role: 'user', content: 'Tell me a story' }
]);

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
*/
