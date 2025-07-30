import { World, WorldCreateTask } from "@shared/types/world";
import { createMoreWorldsPrompt, createWorldPrompt } from "./prompts";
import { OpenAIService } from "@core/services";
import { ApiSettingsService } from "@services/api-settings.service";
import { v4 as uuidv4 } from "uuid";
import { WorldCreateJsonService } from "./files";
import OpenAI from "openai";
import { ApiSettings } from "@shared/types/api-settings";

export class WorldCreateService {
  createOpenAIService(apiSettings: ApiSettings) {
    const openaiService = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiSettings.api.token,
    });

    return openaiService;
  }

  async createWorld(data: WorldCreateTask) {
    const prompt = createWorldPrompt(data.worldType, data.userPrompt);
    const apiSettings = await ApiSettingsService.readFile("api-settings");
    if (!apiSettings) {
      throw new Error("API settings not found");
    }
    console.log(apiSettings);

    const response = await this.createOpenAIService(
      apiSettings
    ).chat.completions.create({
      model: apiSettings.api.model,
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.choices[0].message.content || "";
    const parsedResult = (
      JSON.parse(
        result.replace(/<parse>/g, "").replace(/<\/parse>/g, "")
      ) as World[]
    ).map((world) => ({
      ...world,
      id: uuidv4(),
    }));

    const worldId = uuidv4();
    WorldCreateJsonService.createFile(
      {
        data: parsedResult,
        prompt: [
          { role: "user", content: prompt },
          { role: "assistant", content: result },
        ],
      },
      { filename: worldId, id: worldId }
    );

    return parsedResult;
  }

  async createMoreWorlds(data: WorldCreateTask) {
    const prompt = createMoreWorldsPrompt(data.userPrompt);
    const apiSettings = await ApiSettingsService.readFile("api-settings");
    if (!apiSettings) {
      throw new Error("API settings not found");
    }
    if (!data.lastWorldGenerationId) {
      throw new Error("Last world generation id not found");
    }

    const lastPrompt = await WorldCreateJsonService.readFile(
      data.lastWorldGenerationId
    );

    const response = await this.createOpenAIService(
      apiSettings
    ).chat.completions.create({
      model: apiSettings.api.model,
      messages: [
        ...(lastPrompt?.prompt || []),
        { role: "user", content: prompt },
      ],
    });

    const result = response.choices[0].message.content || "";

    const parsedResult = (
      JSON.parse(
        result.replace(/<parse>/g, "").replace(/<\/parse>/g, "")
      ) as World[]
    ).map((world) => ({
      ...world,
      id: uuidv4(),
    }));

    const worldId = uuidv4();
    WorldCreateJsonService.createFile(
      {
        data: parsedResult,
        prompt: [
          ...(lastPrompt?.prompt || []),
          { role: "user", content: prompt },
          { role: "assistant", content: result },
        ],
      },
      { filename: worldId, id: worldId }
    );

    return parsedResult;
  }
}
