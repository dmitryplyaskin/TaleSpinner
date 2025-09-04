import {
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
  ChatMiddleware,
} from "./chat.service";

/**
 * Middleware для логирования запросов и ответов
 */
export class LoggingMiddleware implements ChatMiddleware {
  name = "logging";

  async beforeCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<{ messages: ChatMessage[]; options: ChatCompletionOptions }> {
    console.log("[ChatService] Отправка запроса:", {
      messageCount: messages.length,
      model: options.model,
      temperature: options.temperature,
    });
    return { messages, options };
  }

  async afterCompletion(
    result: ChatCompletionResult,
    originalMessages: ChatMessage[]
  ): Promise<ChatCompletionResult> {
    console.log("[ChatService] Получен ответ:", {
      contentLength: result.message.content.length,
      usage: result.usage,
      model: result.model,
      finishReason: result.finishReason,
    });
    return result;
  }

  async onError(
    error: Error,
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<void> {
    console.error("[ChatService] Ошибка:", {
      error: error.message,
      messageCount: messages.length,
      model: options.model,
    });
  }
}

/**
 * Middleware для ограничения длины контекста
 */
export class ContextLimitMiddleware implements ChatMiddleware {
  name = "context-limit";

  constructor(private maxTokens: number = 4000) {}

  async beforeCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<{ messages: ChatMessage[]; options: ChatCompletionOptions }> {
    // Простая эвристика: 4 символа ≈ 1 токен
    const estimatedTokens = messages.reduce(
      (sum, msg) => sum + Math.ceil(msg.content.length / 4),
      0
    );

    if (estimatedTokens > this.maxTokens) {
      // Сохраняем системные сообщения и обрезаем остальные
      const systemMessages = messages.filter((msg) => msg.role === "system");
      const conversationMessages = messages.filter(
        (msg) => msg.role !== "system"
      );

      let currentTokens = systemMessages.reduce(
        (sum, msg) => sum + Math.ceil(msg.content.length / 4),
        0
      );
      const truncatedMessages: ChatMessage[] = [...systemMessages];

      // Добавляем сообщения с конца (самые новые)
      for (let i = conversationMessages.length - 1; i >= 0; i--) {
        const message = conversationMessages[i];
        const messageTokens = Math.ceil(message.content.length / 4);

        if (currentTokens + messageTokens <= this.maxTokens) {
          truncatedMessages.push(message);
          currentTokens += messageTokens;
        } else {
          break;
        }
      }

      // Сортируем обратно по времени
      const finalMessages = [
        ...systemMessages,
        ...truncatedMessages.filter((msg) => msg.role !== "system").reverse(),
      ];

      console.log(
        `[ContextLimitMiddleware] Обрезано сообщений: ${messages.length} → ${finalMessages.length}`
      );
      return { messages: finalMessages, options };
    }

    return { messages, options };
  }
}

/**
 * Middleware для добавления метаданных к сообщениям
 */
export class MetadataMiddleware implements ChatMiddleware {
  name = "metadata";

  constructor(private defaultMetadata: Record<string, any> = {}) {}

  async beforeCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<{ messages: ChatMessage[]; options: ChatCompletionOptions }> {
    const messagesWithMetadata = messages.map((msg) => ({
      ...msg,
      metadata: { ...this.defaultMetadata, ...msg.metadata },
    }));

    return { messages: messagesWithMetadata, options };
  }

  async afterCompletion(
    result: ChatCompletionResult,
    originalMessages: ChatMessage[]
  ): Promise<ChatCompletionResult> {
    return {
      ...result,
      message: {
        ...result.message,
        metadata: { ...this.defaultMetadata, ...result.message.metadata },
      },
    };
  }
}

/**
 * Middleware для фильтрации контента
 */
export class ContentFilterMiddleware implements ChatMiddleware {
  name = "content-filter";

  constructor(
    private bannedWords: string[] = [],
    private replacement: string = "[ОТФИЛЬТРОВАНО]"
  ) {}

  async beforeCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<{ messages: ChatMessage[]; options: ChatCompletionOptions }> {
    const filteredMessages = messages.map((msg) => ({
      ...msg,
      content: this.filterContent(msg.content),
    }));

    return { messages: filteredMessages, options };
  }

  async afterCompletion(
    result: ChatCompletionResult,
    originalMessages: ChatMessage[]
  ): Promise<ChatCompletionResult> {
    return {
      ...result,
      message: {
        ...result.message,
        content: this.filterContent(result.message.content),
      },
    };
  }

  private filterContent(content: string): string {
    let filteredContent = content;

    for (const word of this.bannedWords) {
      const regex = new RegExp(word, "gi");
      filteredContent = filteredContent.replace(regex, this.replacement);
    }

    return filteredContent;
  }
}

/**
 * Middleware для retry логики
 */
export class RetryMiddleware implements ChatMiddleware {
  name = "retry";

  constructor(
    private maxRetries: number = 3,
    private retryDelay: number = 1000
  ) {}

  async onError(
    error: Error,
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<void> {
    // Здесь можно реализовать логику retry
    // В данном базовом варианте просто логируем
    console.log(`[RetryMiddleware] Ошибка будет обработана системой retry`);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
