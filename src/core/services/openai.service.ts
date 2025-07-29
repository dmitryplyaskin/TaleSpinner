import OpenAI from "openai";
import {
  ChatCompletionCreateParams,
  ChatCompletionChunk,
} from "openai/resources/chat/completions";

export interface OpenAIServiceConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  project?: string;
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

export interface ChatCompletionParams {
  model?: string;
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  user?: string;
  logit_bias?: Record<string, number>;
  response_format?: { type: "text" | "json_object" };
  seed?: number;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  tool_choice?: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption;
}

export interface StreamingResponse {
  stream: AsyncIterable<ChatCompletionChunk>;
  abort: () => void;
}

export interface CompletionResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  finish_reason: string | null;
}

export class OpenAIService {
  private client: OpenAI;
  private defaultModel: string;

  constructor(config: OpenAIServiceConfig, defaultModel: string = "") {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
      project: config.project,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
      defaultHeaders: config.headers,
    });
    this.defaultModel = defaultModel;
  }

  /**
   * Создает обычный запрос к Chat Completions API
   */
  async createCompletion(
    params: ChatCompletionParams,
    abortController?: AbortController
  ): Promise<CompletionResponse> {
    try {
      const requestParams: ChatCompletionCreateParams = {
        model: params.model || this.defaultModel,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
        top_p: params.top_p,
        frequency_penalty: params.frequency_penalty,
        presence_penalty: params.presence_penalty,
        stop: params.stop,
        user: params.user,
        logit_bias: params.logit_bias,
        response_format: params.response_format,
        seed: params.seed,
        tools: params.tools,
        tool_choice: params.tool_choice,
        stream: false,
      };

      const completion = await this.client.chat.completions.create(
        requestParams,
        {
          signal: abortController?.signal,
        }
      );

      const choice = completion.choices[0];

      return {
        content: choice.message.content || "",
        usage: completion.usage
          ? {
              prompt_tokens: completion.usage.prompt_tokens,
              completion_tokens: completion.usage.completion_tokens,
              total_tokens: completion.usage.total_tokens,
            }
          : undefined,
        model: completion.model,
        finish_reason: choice.finish_reason,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Запрос был отменен");
      }
      throw error;
    }
  }

  /**
   * Создает потоковый запрос к Chat Completions API
   */
  async createStreamingCompletion(
    params: ChatCompletionParams,
    abortController?: AbortController
  ): Promise<StreamingResponse> {
    try {
      const requestParams: ChatCompletionCreateParams = {
        model: params.model || this.defaultModel,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
        top_p: params.top_p,
        frequency_penalty: params.frequency_penalty,
        presence_penalty: params.presence_penalty,
        stop: params.stop,
        user: params.user,
        logit_bias: params.logit_bias,
        response_format: params.response_format,
        seed: params.seed,
        tools: params.tools,
        tool_choice: params.tool_choice,
        stream: true,
      };

      const stream = await this.client.chat.completions.create(requestParams, {
        signal: abortController?.signal,
      });

      return {
        stream,
        abort: () => abortController?.abort(),
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Потоковый запрос был отменен");
      }
      throw error;
    }
  }

  /**
   * Утилитарный метод для сбора полного ответа из потока
   */
  async collectStreamContent(streamingResponse: StreamingResponse): Promise<{
    content: string;
    usage?: any;
    model?: string;
    finish_reason?: string;
  }> {
    let content = "";
    let usage;
    let model;
    let finish_reason;

    try {
      for await (const chunk of streamingResponse.stream) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          content += delta.content;
        }

        if (chunk.usage) {
          usage = chunk.usage;
        }

        if (chunk.model) {
          model = chunk.model;
        }

        if (chunk.choices[0]?.finish_reason) {
          finish_reason = chunk.choices[0].finish_reason;
        }
      }

      return { content, usage, model, finish_reason };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Сбор потокового контента был отменен");
      }
      throw error;
    }
  }

  /**
   * Создает простое сообщение для быстрого использования
   */
  createMessage(
    role: "system" | "user" | "assistant",
    content: string
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam {
    return { role, content };
  }

  /**
   * Проверяет доступность API
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.client.models.list();
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
      const models = await this.client.models.list();
      return models.data.map((model) => model.id);
    } catch (error) {
      throw new Error(`Не удалось получить список моделей: ${error}`);
    }
  }

  /**
   * Обновляет конфигурацию клиента
   */
  updateConfig(config: Partial<OpenAIServiceConfig>): void {
    if (
      config.apiKey ||
      config.baseURL ||
      config.organization ||
      config.project
    ) {
      this.client = new OpenAI({
        apiKey: config.apiKey || this.client.apiKey,
        baseURL: config.baseURL || this.client.baseURL,
        organization: config.organization,
        project: config.project,
        timeout: config.timeout || 60000,
        maxRetries: config.maxRetries || 3,
      });
    }
  }

  /**
   * Устанавливает модель по умолчанию
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
  }

  /**
   * Получает текущую модель по умолчанию
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }
}
