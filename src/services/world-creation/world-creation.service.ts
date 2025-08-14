import {
  createMoreWorldsPrompt,
  createWorldPrompt,
  responseFormat,
} from "./prompts";
import { ApiSettingsService } from "@services/api-settings.service";
import { v4 as uuidv4 } from "uuid";
import {
  WorldCreationDraftJsonService,
  WorldCreationSelectedDraftJsonService,
  WorldCreationFavoritesDraftJsonService,
} from "./files";
import OpenAI from "openai";
import { ApiSettings } from "@shared/types/api-settings";
import {
  CreatedWorldDraft,
  WorldCreateTask,
} from "@shared/types/world-creation";

export class WorldCreateService {
  createOpenAIService(apiSettings: ApiSettings) {
    const openaiService = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiSettings.api.token,
    });

    return openaiService;
  }

  private async callModel(
    apiSettings: ApiSettings,
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    model: string
  ) {
    const openai = this.createOpenAIService(apiSettings);
    const response = await openai.chat.completions.create({
      model,
      messages,
      response_format: responseFormat,
    });

    const content = response.choices[0]?.message?.content || "";
    try {
      return JSON.parse(content) as { worlds: CreatedWorldDraft[] };
    } catch (error) {
      console.error("Error parsing response:", error);
      throw error;
    }
  }

  async createDraftWorlds(data: WorldCreateTask) {
    if (process.env.DEV_MOCK_WORLD_CREATION === "true") {
      const mockId = "5fa858bf-90ab-4bf6-b664-1ae967c3ddfa";
      const mockWorld = await WorldCreationDraftJsonService.readFile(mockId);
      if (!mockWorld) throw new Error("Mock world not found");
      return mockWorld;
    }

    const prompt = createWorldPrompt(data.worldType, data.userPrompt);
    const apiSettings = await ApiSettingsService.readFile("api-settings");

    if (!apiSettings) throw new Error("API settings not found");

    try {
      const result = await this.callModel(
        apiSettings,
        [{ role: "user", content: prompt }],
        apiSettings.api.model
      );

      const parsedResult = result.worlds.map((world) => ({
        ...world,
        id: uuidv4(),
      }));

      const worldId = uuidv4();
      const world = await WorldCreationDraftJsonService.createFile(
        {
          data: parsedResult,
          prompt: [
            { role: "user", content: prompt },
            { role: "assistant", content: JSON.stringify(result) },
          ],
        },
        { filename: worldId, id: worldId }
      );

      return world;
    } catch (error) {
      console.error("Error creating worlds:", error);
      throw error;
    }
  }

  async createMoreWorlds(data: WorldCreateTask) {
    const prompt = createMoreWorldsPrompt(data.userPrompt);
    const apiSettings = await ApiSettingsService.readFile("api-settings");

    if (!apiSettings) throw new Error("API settings not found");
    if (!data.lastWorldGenerationId)
      throw new Error("Last world generation id not found");

    const lastWorld = await WorldCreationDraftJsonService.readFile(
      data.lastWorldGenerationId
    );
    if (!lastWorld) throw new Error("Last world not found");

    try {
      const result = await this.callModel(
        apiSettings,
        [...lastWorld.prompt, { role: "user", content: prompt }],
        apiSettings.api.model
      );

      const parsedResult = result.worlds.map((world) => ({
        ...world,
        id: uuidv4(),
      }));

      const updatedWorld = await WorldCreationDraftJsonService.updateFile(
        lastWorld.id,
        {
          data: [...(lastWorld.data || []), ...parsedResult],
          prompt: [
            ...lastWorld.prompt,
            { role: "user", content: prompt },
            { role: "assistant", content: JSON.stringify(result) },
          ],
        }
      );

      return updatedWorld;
    } catch (error) {
      console.error("Error creating more worlds:", error);
      throw error;
    }
  }

  async selectWorld(data: WorldCreateTask) {
    // const world = await WorldCreationDraftJsonService.readFile(data.lastWorldGenerationId);
    // if (!world) throw new Error("World not found");
    // const selectedWorld = await WorldCreationSelectedDraftJsonService.createFile(world, { filename: world.id, id: world.id });
    // return selectedWorld;
  }

  async addWorldToFavorites(data: {
    worldId: string;
    lastWorldGenerationId: string;
  }) {
    const lastWorld = await WorldCreationDraftJsonService.readFile(
      data.lastWorldGenerationId
    );

    if (!lastWorld) throw new Error("Last world not found");

    const world = lastWorld.data?.find((world) => world.id === data.worldId);
    if (!world) throw new Error("World not found");

    const favoritesWorld =
      await WorldCreationFavoritesDraftJsonService.createFile(
        { ...world, isFavorite: true },
        {
          filename: world.id,
          id: world.id,
        }
      );

    await WorldCreationDraftJsonService.updateFile(lastWorld.id, {
      data: lastWorld.data?.map((world) =>
        world.id === data.worldId ? { ...world, isFavorite: true } : world
      ),
    });

    return favoritesWorld;
  }

  async createWorld(data: any) {
    // const world = await WorldCreationDraftJsonService.readFile(data.lastWorldGenerationId);
    // if (!world) throw new Error("World not found");
    // return world;
  }
}
