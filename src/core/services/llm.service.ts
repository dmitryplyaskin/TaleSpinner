import OpenAI from "openai";
import { ApiSettingsService } from "@services/api-settings.service";
import { z } from "zod";

type ZodSchema = z.ZodType;

export interface LLMResponseFormat {
  schema: ZodSchema;
  name: string;
}

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
      model: settings.model || "openai/gpt-4o",
      providerOrder: settings.providerOrder || [],
    };
  }

  private zodToResponseFormat(
    responseFormat: LLMResponseFormat
  ): OpenAI.ResponseFormatJSONSchema {
    const jsonSchema = z.toJSONSchema(responseFormat.schema);

    return {
      type: "json_schema",
      json_schema: {
        name: responseFormat.name,
        strict: true,
        schema: jsonSchema as Record<string, unknown>,
      },
    };
  }

  public async call({
    messages,
    responseFormat,
    temperature = 0.7,
  }: {
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    responseFormat?: LLMResponseFormat;
    temperature?: number;
  }): Promise<unknown> {
    const { client, model, providerOrder } = await this.getClient();

    try {
      const extraBody =
        providerOrder.length > 0
          ? {
              provider: {
                order: providerOrder,
                allow_fallbacks: true,
              },
            }
          : undefined;

      const openAIResponseFormat = responseFormat
        ? this.zodToResponseFormat(responseFormat)
        : undefined;

      const response = await client.chat.completions.create({
        model,
        messages,
        response_format: openAIResponseFormat,
        temperature,
        ...extraBody,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from LLM");
      }

      if (responseFormat) {
        let jsonContent = content.trim();
        if (jsonContent.startsWith("```")) {
          jsonContent = jsonContent.replace(/^```(?:json)?\s*\n?/, "");
          jsonContent = jsonContent.replace(/\n?```\s*$/, "");
        }
        return JSON.parse(jsonContent);
      }

      return content;
    } catch (error) {
      console.error("LLM Call Failed:", error);
      throw error;
    }
  }
}
