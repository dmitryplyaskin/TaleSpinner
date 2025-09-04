import OpenAI from "openai";
import { ApiSettings, Provider } from "@shared/types/api-settings";
import { ApiSettingsService } from "@services/api-settings.service";

export interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
  stream?: boolean;
  responseFormat?:
    | { type: "text" | "json_object" }
    | OpenAI.ResponseFormatJSONSchema;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  toolChoice?: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption;
}

export interface ChatCompletionResult {
  message: ChatMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  model: string;
}

export interface StreamingChatResult {
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  abort: () => void;
  collectContent: () => Promise<ChatCompletionResult>;
}

export interface ChatMiddleware {
  name: string;
  beforeCompletion?: (
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ) => Promise<{
    messages: ChatMessage[];
    options: ChatCompletionOptions;
  }>;
  afterCompletion?: (
    result: ChatCompletionResult,
    originalMessages: ChatMessage[]
  ) => Promise<ChatCompletionResult>;
  onError?: (
    error: Error,
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ) => Promise<void>;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatService {
  private middlewares: ChatMiddleware[] = [];
  private abortController?: AbortController;

  /**
   * Создает OpenAI клиент на основе настроек провайдера
   */
  private createOpenAIClient(provider: Provider): OpenAI {
    let baseURL = "";
    let apiKey = provider.token;

    switch (provider.type) {
      case "openrouter":
        baseURL = "https://openrouter.ai/api/v1";
        break;
      case "openai":
        baseURL = "https://api.openai.com/v1";
        break;
      case "anthropic":
        // Anthropic через OpenRouter или прямой API
        baseURL = "https://openrouter.ai/api/v1";
        break;
      case "custom-openai":
        baseURL = provider.url;
        apiKey = provider.token || "";
        break;
      case "ollama":
        baseURL = `${provider.url}/v1`;
        apiKey = provider.token || "ollama";
        break;
      default:
        throw new Error(
          `Неподдерживаемый тип провайдера: ${(provider as any).type}`
        );
    }

    return new OpenAI({
      baseURL,
      apiKey,
      timeout: 60000,
      maxRetries: 3,
    });
  }

  /**
   * Преобразует внутренние сообщения в формат OpenAI
   */
  private messagesToOpenAI(
    messages: ChatMessage[]
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Создает сообщение с уникальным ID
   */
  createMessage(
    role: ChatMessage["role"],
    content: string,
    metadata?: Record<string, any>
  ): ChatMessage {
    return {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      metadata,
    };
  }

  /**
   * Добавляет middleware в цепочку обработки
   */
  addMiddleware(middleware: ChatMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Удаляет middleware по имени
   */
  removeMiddleware(name: string): void {
    this.middlewares = this.middlewares.filter((m) => m.name !== name);
  }

  /**
   * Очищает все middleware
   */
  clearMiddlewares(): void {
    this.middlewares = [];
  }

  /**
   * Применяет middleware перед выполнением запроса
   */
  private async applyBeforeMiddlewares(
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<{ messages: ChatMessage[]; options: ChatCompletionOptions }> {
    let processedMessages = [...messages];
    let processedOptions = { ...options };

    for (const middleware of this.middlewares) {
      if (middleware.beforeCompletion) {
        const result = await middleware.beforeCompletion(
          processedMessages,
          processedOptions
        );
        processedMessages = result.messages;
        processedOptions = result.options;
      }
    }

    return { messages: processedMessages, options: processedOptions };
  }

  /**
   * Применяет middleware после получения ответа
   */
  private async applyAfterMiddlewares(
    result: ChatCompletionResult,
    originalMessages: ChatMessage[]
  ): Promise<ChatCompletionResult> {
    let processedResult = { ...result };

    for (const middleware of this.middlewares) {
      if (middleware.afterCompletion) {
        processedResult = await middleware.afterCompletion(
          processedResult,
          originalMessages
        );
      }
    }

    return processedResult;
  }

  /**
   * Применяет middleware при ошибке
   */
  private async applyErrorMiddlewares(
    error: Error,
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<void> {
    for (const middleware of this.middlewares) {
      if (middleware.onError) {
        await middleware.onError(error, messages, options);
      }
    }
  }

  /**
   * Основной метод для создания chat completion
   */
  async createCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResult> {
    try {
      // Получаем настройки API
      const apiSettings = await ApiSettingsService.readFile("api-settings");
      if (!apiSettings) {
        throw new Error("API настройки не найдены");
      }

      // Применяем middleware перед запросом
      const { messages: processedMessages, options: processedOptions } =
        await this.applyBeforeMiddlewares(messages, options);

      // Создаем OpenAI клиент
      const client = this.createOpenAIClient(apiSettings.api);

      // Подготавливаем параметры запроса
      const requestParams: OpenAI.Chat.Completions.ChatCompletionCreateParams =
        {
          model: processedOptions.model || apiSettings.api.model || "",
          messages: this.messagesToOpenAI(processedMessages),
          temperature:
            processedOptions.temperature ??
            apiSettings.api.settings.temperature,
          max_tokens:
            processedOptions.maxTokens ?? apiSettings.api.settings.maxTokens,
          top_p: processedOptions.topP ?? apiSettings.api.settings.topP,
          frequency_penalty:
            processedOptions.frequencyPenalty ??
            apiSettings.api.settings.frequencyPenalty,
          presence_penalty:
            processedOptions.presencePenalty ??
            apiSettings.api.settings.presencePenalty,
          stop: processedOptions.stop,
          response_format: processedOptions.responseFormat,
          tools: processedOptions.tools,
          tool_choice: processedOptions.toolChoice,
          stream: false,
        };

      // Создаем контроллер для отмены запроса
      this.abortController = new AbortController();

      // Выполняем запрос
      const completion = await client.chat.completions.create(requestParams, {
        signal: this.abortController.signal,
      });

      if (!completion.choices || completion.choices.length === 0) {
        throw new Error("Не получен ответ от модели");
      }

      const choice = completion.choices[0];
      const content = choice.message.content || "";

      // Создаем результат
      const result: ChatCompletionResult = {
        message: this.createMessage("assistant", content),
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
            }
          : undefined,
        finishReason: choice.finish_reason || undefined,
        model: completion.model,
      };

      // Применяем middleware после запроса
      const finalResult = await this.applyAfterMiddlewares(result, messages);

      return finalResult;
    } catch (error) {
      // Применяем middleware для обработки ошибок
      await this.applyErrorMiddlewares(error as Error, messages, options);
      throw error;
    }
  }

  /**
   * Создает потоковый chat completion
   */
  async createStreamingCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<StreamingChatResult> {
    try {
      // Получаем настройки API
      const apiSettings = await ApiSettingsService.readFile("api-settings");
      if (!apiSettings) {
        throw new Error("API настройки не найдены");
      }

      // Применяем middleware перед запросом
      const { messages: processedMessages, options: processedOptions } =
        await this.applyBeforeMiddlewares(messages, options);

      // Создаем OpenAI клиент
      const client = this.createOpenAIClient(apiSettings.api);

      // Подготавливаем параметры запроса
      const requestParams: OpenAI.Chat.Completions.ChatCompletionCreateParams =
        {
          model: processedOptions.model || apiSettings.api.model || "",
          messages: this.messagesToOpenAI(processedMessages),
          temperature:
            processedOptions.temperature ??
            apiSettings.api.settings.temperature,
          max_tokens:
            processedOptions.maxTokens ?? apiSettings.api.settings.maxTokens,
          top_p: processedOptions.topP ?? apiSettings.api.settings.topP,
          frequency_penalty:
            processedOptions.frequencyPenalty ??
            apiSettings.api.settings.frequencyPenalty,
          presence_penalty:
            processedOptions.presencePenalty ??
            apiSettings.api.settings.presencePenalty,
          stop: processedOptions.stop,
          response_format: processedOptions.responseFormat,
          tools: processedOptions.tools,
          tool_choice: processedOptions.toolChoice,
          stream: true,
        };

      // Создаем контроллер для отмены запроса
      this.abortController = new AbortController();

      // Выполняем потоковый запрос
      const stream = await client.chat.completions.create(requestParams, {
        signal: this.abortController.signal,
      });

      return {
        stream,
        abort: () => this.abortController?.abort(),
        collectContent: async () => {
          let content = "";
          let usage;
          let model = "";
          let finishReason;

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;

            if (delta?.content) {
              content += delta.content;
            }

            if (chunk.usage) {
              usage = {
                promptTokens: chunk.usage.prompt_tokens,
                completionTokens: chunk.usage.completion_tokens,
                totalTokens: chunk.usage.total_tokens,
              };
            }

            if (chunk.model) {
              model = chunk.model;
            }

            if (chunk.choices[0]?.finish_reason) {
              finishReason = chunk.choices[0].finish_reason;
            }
          }

          const result: ChatCompletionResult = {
            message: this.createMessage("assistant", content),
            usage,
            finishReason: finishReason || undefined,
            model,
          };

          return await this.applyAfterMiddlewares(result, messages);
        },
      };
    } catch (error) {
      await this.applyErrorMiddlewares(error as Error, messages, options);
      throw error;
    }
  }

  /**
   * Простой метод для отправки одного сообщения
   */
  async sendMessage(
    content: string,
    systemPrompt?: string,
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResult> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push(this.createMessage("system", systemPrompt));
    }

    messages.push(this.createMessage("user", content));

    return await this.createCompletion(messages, options);
  }

  /**
   * Продолжает существующий разговор
   */
  async continueConversation(
    session: ChatSession,
    userMessage: string,
    options: ChatCompletionOptions = {}
  ): Promise<{
    result: ChatCompletionResult;
    updatedSession: ChatSession;
  }> {
    // Добавляем сообщение пользователя
    const userMsg = this.createMessage("user", userMessage);
    const messagesWithUser = [...session.messages, userMsg];

    // Получаем ответ от модели
    const result = await this.createCompletion(messagesWithUser, options);

    // Обновляем сессию
    const updatedSession: ChatSession = {
      ...session,
      messages: [...messagesWithUser, result.message],
      updatedAt: new Date(),
    };

    return { result, updatedSession };
  }

  /**
   * Создает новую сессию чата
   */
  createSession(
    systemPrompt?: string,
    metadata?: Record<string, any>
  ): ChatSession {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push(this.createMessage("system", systemPrompt));
    }

    return {
      id: crypto.randomUUID(),
      messages,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Отменяет текущий запрос
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Проверяет доступность API
   */
  async checkHealth(): Promise<boolean> {
    try {
      const apiSettings = await ApiSettingsService.readFile("api-settings");
      if (!apiSettings) return false;

      const client = this.createOpenAIClient(apiSettings.api);
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Получает список доступных моделей
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const apiSettings = await ApiSettingsService.readFile("api-settings");
      if (!apiSettings) {
        throw new Error("API настройки не найдены");
      }

      const client = this.createOpenAIClient(apiSettings.api);
      const models = await client.models.list();
      return models.data.map((model) => model.id);
    } catch (error) {
      throw new Error(`Не удалось получить список моделей: ${error}`);
    }
  }

  /**
   * Подсчитывает приблизительное количество токенов в сообщениях
   * Простая эвристика: ~4 символа = 1 токен
   */
  estimateTokens(messages: ChatMessage[]): number {
    const totalChars = messages.reduce(
      (sum, msg) => sum + msg.content.length,
      0
    );
    return Math.ceil(totalChars / 4);
  }

  /**
   * Обрезает историю сообщений до указанного лимита токенов
   */
  truncateMessages(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
    const systemMessages = messages.filter((msg) => msg.role === "system");
    const conversationMessages = messages.filter(
      (msg) => msg.role !== "system"
    );

    let currentTokens = this.estimateTokens(systemMessages);
    const truncatedConversation: ChatMessage[] = [];

    // Добавляем сообщения с конца (самые новые)
    for (let i = conversationMessages.length - 1; i >= 0; i--) {
      const message = conversationMessages[i];
      const messageTokens = this.estimateTokens([message]);

      if (currentTokens + messageTokens <= maxTokens) {
        truncatedConversation.unshift(message);
        currentTokens += messageTokens;
      } else {
        break;
      }
    }

    return [...systemMessages, ...truncatedConversation];
  }

  /**
   * Получает текущие настройки API
   */
  async getApiSettings(): Promise<ApiSettings | null> {
    return await ApiSettingsService.readFile("api-settings");
  }
}
