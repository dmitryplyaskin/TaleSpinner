import { WorldCreateTask } from "@shared/types/world";
import { createWorldPrompt } from "./prompts";
import { OpenAIService } from "@core/services";
import { ApiSettingsService } from "@services/api-settings.service";
import { v4 as uuidv4 } from "uuid";
import { WorldCreateJsonService } from "./files";
import OpenAI from "openai";

export class WorldCreateService {
  async createWorld(data: WorldCreateTask) {
    const prompt = createWorldPrompt(data.worldType, data.userPrompt);
    const apiSettings = await ApiSettingsService.readFile("api-settings");
    if (!apiSettings) {
      throw new Error("API settings not found");
    }
    console.log(apiSettings);

    const openaiService = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiSettings.api.token,
      // @ts-ignore
      headers: {
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "TaleSpinner",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiSettings.api.token}`,
      },
    });
    // const openaiService = new OpenAIService({
    //   apiKey: apiSettings.api.token,
    //   baseURL: "https://openrouter.ai/api/v1",
    //   headers: {
    //     "HTTP-Referer": "http://localhost:5000",
    //     "X-Title": "TaleSpinner",
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${apiSettings.api.token}`,
    //   },
    // });

    const response = await openaiService.chat.completions.create({
      model: apiSettings.api.model,
      messages: [{ role: "user", content: prompt }],
    });

    const worldId = uuidv4();
    WorldCreateJsonService.createFile(
      { data: response },
      { filename: worldId, id: worldId }
    );

    return response;
  }
}
