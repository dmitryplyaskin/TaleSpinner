import { z } from "zod";
import {
  createMoreWorldsPrompt,
  createDraftWorldsPrompt,
  createWorldsPrompt,
  createRacesPrompt,
  createTimelinePrompt,
  createMagicPrompt,
  createLocationsPrompt,
  createFactionsPrompt,
  createFirstMessagePrompt,
} from "./prompts";
import { ApiSettingsService } from "@services/api-settings.service";
import { v4 as uuidv4 } from "uuid";
import {
  WorldCreationDraftJsonService,
  WorldCreationFavoritesDraftJsonService,
  WorldCreationPrimerJsonService,
  CharactersJsonService,
  WorldCreationCompleteJsonService,
} from "./files";
import OpenAI from "openai";
import {
  CreatedWorldDraft,
  WorldCreateTask,
  WorldCustomizationData,
  WorldPrimer,
} from "@shared/types/world-creation";
import { Character, CharacterCreationData } from "@shared/types/character";
import {
  draftWorldsResponseFormat,
  createWorldPrimerResponseFormat,
  racesResponseFormat,
  timelineResponseFormat,
  magicResponseFormat,
  locationsResponseFormat,
  factionsResponseFormat,
  firstMessageResponseFormat,
} from "./schemas";
import { LLMResponseFormat } from "@core/services/llm.service";
import { GameSessionsService } from "@services/game-sessions";
import { LLMOutputLanguage } from "@shared/types/settings";

interface InternalApiSettings {
  token: string;
  model: string;
  providerOrder: string[];
  llmOutputLanguage: LLMOutputLanguage;
}

export class WorldCreateService {
  createOpenAIService(token: string) {
    const openaiService = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: token,
    });

    return openaiService;
  }

  private async getApiSettings(): Promise<InternalApiSettings> {
    const internalSettings = await ApiSettingsService.getInternalSettings();
    if (!internalSettings || !internalSettings.token) {
      throw new Error("API settings or token not found");
    }

    return {
      token: internalSettings.token,
      model: internalSettings.model,
      providerOrder: internalSettings.providerOrder,
      llmOutputLanguage: internalSettings.llmOutputLanguage,
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

  private async callModel(data: {
    apiSettings: InternalApiSettings;
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    model?: string;
    responseFormat: LLMResponseFormat;
  }) {
    const openai = this.createOpenAIService(data.apiSettings.token);

    const extraBody =
      data.apiSettings.providerOrder.length > 0
        ? {
            provider: {
              order: data.apiSettings.providerOrder,
              allow_fallbacks: true,
            },
          }
        : undefined;

    const openAIResponseFormat = this.zodToResponseFormat(data.responseFormat);

    const response = await openai.chat.completions.create({
      model: data.model || "",
      messages: data.messages,
      response_format: openAIResponseFormat,
      ...extraBody,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("No response choices received from AI model");
    }

    const content = response.choices[0]?.message?.content || "";
    if (!content) {
      throw new Error("Empty content received from AI model");
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      console.error("Error parsing response:", error);
      console.error("Raw content:", content);
      throw error;
    }
  }

  async createDraftWorlds(data: WorldCreateTask) {
    const apiSettings = await this.getApiSettings();

    const outputLanguage = apiSettings.llmOutputLanguage || "ru";
    const prompt = createDraftWorldsPrompt(
      data.worldType,
      data.userPrompt,
      outputLanguage
    );

    try {
      const result = (await this.callModel({
        apiSettings,
        messages: [{ role: "user", content: prompt }],
        model: apiSettings.model || "",
        responseFormat: draftWorldsResponseFormat,
      })) as { worlds: CreatedWorldDraft[] };

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
    const apiSettings = await this.getApiSettings();
    if (!data.lastWorldGenerationId)
      throw new Error("Last world generation id not found");

    const outputLanguage = apiSettings.llmOutputLanguage || "ru";
    const prompt = createMoreWorldsPrompt(data.userPrompt, outputLanguage);

    const lastWorld = await WorldCreationDraftJsonService.readFile(
      data.lastWorldGenerationId
    );
    if (!lastWorld) throw new Error("Last world not found");

    try {
      const result = (await this.callModel({
        apiSettings,
        messages: [...lastWorld.prompt, { role: "user", content: prompt }],
        model: apiSettings.model,
        responseFormat: draftWorldsResponseFormat,
      })) as { worlds: CreatedWorldDraft[] };

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

  async createWorld(data: WorldCustomizationData) {
    const apiSettings = await this.getApiSettings();

    const outputLanguage = apiSettings.llmOutputLanguage || "ru";
    const prompt = createWorldsPrompt(data, outputLanguage);
    console.log(prompt);

    try {
      const baseResult = await this.callModel({
        apiSettings,
        messages: [{ role: "user", content: prompt }],
        model: apiSettings.model,
        responseFormat: createWorldPrimerResponseFormat(data),
      });

      const worldPrimer = baseResult.world_primer || "";

      const detailedWorld: Record<string, unknown> = {
        ...baseResult,
        detailed_elements: {},
      };

      console.log("detailedWorld:", detailedWorld);

      const additionalCalls: Promise<{ type: string; data: unknown }>[] = [];

      if (data.racesEnabled) {
        const racesCall = this.callModel({
          apiSettings,
          messages: [
            {
              role: "user",
              content: createRacesPrompt(data, worldPrimer, outputLanguage),
            },
          ],
          model: apiSettings.model,
          responseFormat: racesResponseFormat,
        }).then((result) => ({ type: "races", data: result }));
        additionalCalls.push(racesCall);
      }

      if (data.timelineEnabled) {
        const timelineCall = this.callModel({
          apiSettings,
          messages: [
            {
              role: "user",
              content: createTimelinePrompt(data, worldPrimer, outputLanguage),
            },
          ],
          model: apiSettings.model,
          responseFormat: timelineResponseFormat,
        }).then((result) => ({ type: "timeline", data: result }));
        additionalCalls.push(timelineCall);
      }

      if (data.magicEnabled) {
        const magicCall = this.callModel({
          apiSettings,
          messages: [
            {
              role: "user",
              content: createMagicPrompt(data, worldPrimer, outputLanguage),
            },
          ],
          model: apiSettings.model,
          responseFormat: magicResponseFormat,
        }).then((result) => ({ type: "magic", data: result }));
        additionalCalls.push(magicCall);
      }

      if (data.locationsEnabled) {
        const locationsCall = this.callModel({
          apiSettings,
          messages: [
            {
              role: "user",
              content: createLocationsPrompt(data, worldPrimer, outputLanguage),
            },
          ],
          model: apiSettings.model,
          responseFormat: locationsResponseFormat,
        }).then((result) => ({ type: "locations", data: result }));
        additionalCalls.push(locationsCall);
      }

      if (data.factionsEnabled) {
        const factionsCall = this.callModel({
          apiSettings,
          messages: [
            {
              role: "user",
              content: createFactionsPrompt(data, worldPrimer, outputLanguage),
            },
          ],
          model: apiSettings.model,
          responseFormat: factionsResponseFormat,
        }).then((result) => ({ type: "factions", data: result }));
        additionalCalls.push(factionsCall);
      }

      if (additionalCalls.length > 0) {
        const additionalResults = await Promise.all(additionalCalls);

        additionalResults.forEach((result) => {
          (detailedWorld.detailed_elements as Record<string, unknown>)[
            result.type
          ] = result.data;
        });
      }

      const world = await WorldCreationPrimerJsonService.createFile(
        detailedWorld,
        {
          id: uuidv4(),
        }
      );

      console.log("Создан мир с детализированными элементами:", world);
      return world;
    } catch (error) {
      console.error("Error creating world:", error);
      throw error;
    }
  }

  async updateWorld(data: WorldPrimer) {
    const world = await WorldCreationPrimerJsonService.readFile(data.id);
    if (!world) throw new Error("World not found");
    const updatedWorld = await WorldCreationPrimerJsonService.updateFile(
      data.id,
      data
    );
    return updatedWorld;
  }

  async saveCharacter(data: CharacterCreationData): Promise<Character> {
    try {
      console.log("Сохранение персонажа:", data.character);

      const savedCharacter = await CharactersJsonService.createFile(
        data.character,
        {
          id: data.character.id,
        }
      );
      console.log("data:", data);

      if (!data.worldId) throw new Error("World id not found");
      const world = await WorldCreationPrimerJsonService.readFile(data.worldId);
      if (!world) throw new Error("World not found");

      const updatedWorld = await WorldCreationPrimerJsonService.updateFile(
        data.worldId,
        {
          ...world,
          characters: {
            userCharacter: savedCharacter,
          },
        }
      );

      return updatedWorld;
    } catch (error) {
      console.error("Error saving character:", error);
      throw error;
    }
  }

  async completeWorldCreation(data: WorldPrimer) {
    const world = await WorldCreationPrimerJsonService.readFile(data.id);
    const apiSettings = await this.getApiSettings();

    const outputLanguage = apiSettings.llmOutputLanguage || "ru";
    const firstMessage = await this.callModel({
      apiSettings,
      messages: [
        { role: "user", content: createFirstMessagePrompt(data, outputLanguage) },
      ],
      model: apiSettings.model,
      responseFormat: firstMessageResponseFormat,
    });

    if (!world) throw new Error("World not found");

    const dataWithFirstMessage: WorldPrimer = {
      ...world,
      first_message: firstMessage,
    };

    const completeWorld = await WorldCreationCompleteJsonService.createFile(
      dataWithFirstMessage,
      {
        id: data.id,
        overwrite: true,
      }
    );

    // TODO: Оч плохо, переписать
    await new GameSessionsService().initGameSessions(dataWithFirstMessage);

    return completeWorld;
  }
}
