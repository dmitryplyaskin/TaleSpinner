import {
  createMoreWorldsPrompt,
  createWorldPrompt,
  responseFormat,
} from "./prompts";
import { ApiSettingsService } from "@services/api-settings.service";
import { v4 as uuidv4 } from "uuid";
import { WorldCreateJsonService } from "./files";
import OpenAI from "openai";
import { ApiSettings } from "@shared/types/api-settings";
import { CreatedWorld, WorldCreateTask } from "@shared/types/world-creation";

export class WorldCreateService {
  createOpenAIService(apiSettings: ApiSettings) {
    const openaiService = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiSettings.api.token,
    });

    return openaiService;
  }

  async createWorlds(data: WorldCreateTask) {
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
      // @ts-ignore
      response_format: responseFormat,
    });

    const result = response.choices[0].message.content || "";
    console.log(result);
    const parsedResult = (
      JSON.parse(result) as { worlds: CreatedWorld[] }
    )?.worlds?.map((world) => ({
      ...world,
      id: uuidv4(),
    }));

    const worldId = uuidv4();
    const world = await WorldCreateJsonService.createFile(
      {
        data: parsedResult,
        prompt: [
          { role: "user", content: prompt },
          { role: "assistant", content: result },
        ],
      },
      { filename: worldId, id: worldId }
    );

    return world;
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

    const lastWorld = await WorldCreateJsonService.readFile(
      data.lastWorldGenerationId
    );
    if (!lastWorld) {
      throw new Error("Last world not found");
    }

    const response = await this.createOpenAIService(
      apiSettings
    ).chat.completions.create({
      model: apiSettings.api.model,
      messages: [
        ...(lastWorld?.prompt || []),
        { role: "user", content: prompt },
      ],
      // @ts-ignore
      response_format: responseFormat,
    });

    const result = response.choices[0].message.content || "";

    console.log(result);

    const parsedResult = (
      JSON.parse(result) as { worlds: CreatedWorld[] }
    )?.worlds?.map((world) => ({
      ...world,
      id: uuidv4(),
    }));

    const updatedWorld = await WorldCreateJsonService.updateFile(
      lastWorld?.id,
      {
        data: [...(lastWorld?.data || []), ...parsedResult],
        prompt: [
          ...(lastWorld?.prompt || []),
          { role: "user", content: prompt },
          { role: "assistant", content: result },
        ],
      }
    );

    return updatedWorld;
  }
}
