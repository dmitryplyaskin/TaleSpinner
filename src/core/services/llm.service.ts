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

  private async getClient(): Promise<{ client: OpenAI; model: string }> {
    const apiSettings = await ApiSettingsService.readFile("api-settings");
    if (!apiSettings || !apiSettings.api.token) {
      throw new Error("API settings or token not found");
    }

    return {
      client: new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiSettings.api.token,
      }),
      model: apiSettings.api.model || "openai/gpt-4o", // Default fallback
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
  }): Promise<any> {
    const { client, model } = await this.getClient();

    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        response_format: responseFormat,
        temperature,
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
