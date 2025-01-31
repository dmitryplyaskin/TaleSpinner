import fs from "fs";
import path from "path";
import OpenAI from "openai";
import axios from "axios";
import { ChatCompletionMessageParam } from "openai/resources";

interface OpenRouterConfig {
  apiKey: string;
  model?: string;
}

interface OpenRouterResponse {
  content: string;
  error: string | null;
}

class OpenRouterService {
  private configPath: string;

  constructor() {
    this.configPath = path.join(
      __dirname,
      "..",
      "..",
      "data",
      "config",
      "openrouter.json"
    );
    this.ensureConfigDirectory();
  }

  private ensureConfigDirectory(): void {
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  getConfig(): OpenRouterConfig {
    if (!fs.existsSync(this.configPath)) {
      throw new Error("OpenRouter configuration file not found");
    }
    return JSON.parse(fs.readFileSync(this.configPath, "utf-8"));
  }

  updateConfig(config: OpenRouterConfig): void {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  private createClient(): OpenAI {
    const config = this.getConfig();
    return new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: config.apiKey,
      // @ts-ignore
      headers: {
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Chat Application",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
    });
  }

  async getModels(): Promise<any[]> {
    const config = this.getConfig();
    try {
      const response = await axios.get("https://openrouter.ai/api/v1/models", {
        headers: {
          "HTTP-Referer": "http://localhost:5000",
          "X-Title": "Chat Application",
          Authorization: `Bearer ${config.apiKey}`,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching models:", error);
      return [];
    }
  }

  async createChatCompletion(
    messages: Array<{ role: string; content: string }>,
    settings: Record<string, unknown> = {}
  ): Promise<any> {
    const client = this.createClient();
    const config = this.getConfig();

    return await client.chat.completions.create({
      model: config?.model || "amazon/nova-micro-v1",
      messages: messages as ChatCompletionMessageParam[],
      ...settings,
      stream: true,
    });
  }

  async *streamResponse(
    messages: Array<{ role: string; content: string }>,
    settings: Record<string, unknown>
  ): AsyncGenerator<OpenRouterResponse> {
    try {
      const response = await this.createChatCompletion(messages, settings);
      let fullResponse = "";

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          yield { content, error: null };
        }
      }

      return fullResponse;
    } catch (error) {
      console.error("OpenRouter API Error:", error);
      yield { content: "", error: (error as Error).message };
      return "";
    }
  }
}

export default new OpenRouterService();
