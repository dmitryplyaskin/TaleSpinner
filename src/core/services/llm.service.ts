import OpenAI from "openai";
import { ApiSettingsService } from "@services/api-settings.service";

export class LLMService {
  private static instance: LLMService;

  private constructor() {}

  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  private async getClient(): Promise<{
    client: OpenAI;
    model: string;
    providerOrder: string[];
  }> {
    const settings = await ApiSettingsService.getInternalSettings();
    if (!settings || !settings.token) {
      throw new Error("API settings or token not found");
    }

    return {
      client: new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: settings.token,
      }),
      model: settings.model || "openai/gpt-4o", // Default fallback
      providerOrder: settings.providerOrder || [],
    };
  }

  public async call({
    messages,
    responseFormat,
    temperature = 0.7,
  }: {
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    responseFormat?: OpenAI.ResponseFormatJSONSchema;
    temperature?: number;
  }): Promise<unknown> {
    const { client, model, providerOrder } = await this.getClient();

    try {
      // Формируем extra body для provider order если указан
      const extraBody =
        providerOrder.length > 0
          ? {
              provider: {
                order: providerOrder,
                allow_fallbacks: true,
              },
            }
          : undefined;

      const response = await client.chat.completions.create({
        model,
        messages,
        response_format: responseFormat,
        temperature,
        ...extraBody,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from LLM");
      }

      if (responseFormat?.type === "json_schema") {
        return JSON.parse(content);
      }

      return content;
    } catch (error) {
      console.error("LLM Call Failed:", error);
      throw error;
    }
  }
}
