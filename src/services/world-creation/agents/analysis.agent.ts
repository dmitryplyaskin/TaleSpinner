import { LLMService } from "@core/services/llm.service";
import { OpenAI } from "openai";

export class AnalysisAgent {
  private llm: LLMService;

  constructor() {
    this.llm = LLMService.getInstance();
  }

  public async analyze(
    userInput: string,
    currentKnownInfo: string[],
    setting: string
  ): Promise<{
    known_info: string[];
    missing_info: string[];
    next_question: { id: string; text: string; category: string } | null;
    is_ready: boolean;
  }> {
    const prompt = `
      You are an expert World Building Assistant.
      Your goal is to help a user create a detailed RPG world setting (${setting}).
      
      Current Known Information:
      ${JSON.stringify(currentKnownInfo)}

      User Input:
      "${userInput}"

      Task:
      1. Analyze the user input and extract new facts about the world (Tone, Factions, Locations, Magic, History, Races).
      2. Compare with the required information to build a complete world primer.
      3. Required Information categories:
         - Core Concept & Tone
         - Geography & Locations
         - Factions & Politics
         - Races & Inhabitants
         - History & Timeline
         - Magic/Technology System
      4. Identify what is missing.
      5. If the user says "surprise me", "you decide", or provides enough detail for a solid foundation, mark 'is_ready' as true.
      6. If critical information is missing, generate ONE specific, creative, and engaging question to ask the user to fill a gap. Do not ask generic questions like "Tell me about factions". Ask something like "Who controls the trade routes in the floating islands?" based on context.
      7. Return the result in JSON format.
    `;

    const responseFormat: OpenAI.ResponseFormatJSONSchema = {
      type: "json_schema",
      json_schema: {
        name: "world_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            known_info: {
              type: "array",
              items: { type: "string" },
              description: "List of facts gathered so far.",
            },
            missing_info: {
              type: "array",
              items: { type: "string" },
              description: "List of categories or specific details missing.",
            },
            next_question: {
              anyOf: [
                {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    text: { type: "string" },
                    category: { type: "string" },
                  },
                  required: ["id", "text", "category"],
                  additionalProperties: false,
                },
                {
                  type: "null",
                },
              ],
              description: "Next question to ask the user, or null if ready.",
            },
            is_ready: {
              type: "boolean",
              description: "True if enough info is gathered or user opted for auto-generation.",
            },
          },
          required: ["known_info", "missing_info", "next_question", "is_ready"],
          additionalProperties: false,
        },
      },
    };

    return await this.llm.call({
      messages: [{ role: "user", content: prompt }],
      responseFormat,
    });
  }
}
