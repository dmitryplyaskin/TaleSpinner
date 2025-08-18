import { OpenAI } from "openai";
import { WorldCustomizationData } from "@shared/types/world-creation";

export const createDraftWorldsResponseFormat: OpenAI.ResponseFormatJSONSchema =
  {
    type: "json_schema",
    json_schema: {
      name: "rpg_worlds",
      strict: true,
      schema: {
        type: "object",
        properties: {
          worlds: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                title: { type: "string" },
                genre: { type: "string" },
                tone: {
                  type: "array",
                  items: { type: "string" },
                },
                unique_feature: { type: "string" },
                synopsis: { type: "string" },
              },
              required: [
                "id",
                "title",
                "genre",
                "tone",
                "unique_feature",
                "synopsis",
              ],
              additionalProperties: false,
            },
            minItems: 3,
            maxItems: 3,
          },
        },
        required: ["worlds"],
        additionalProperties: false,
      },
    },
  };

export const createWorldPrimerResponseFormat = (
  data: WorldCustomizationData
): OpenAI.ResponseFormatJSONSchema => {
  return {
    type: "json_schema",
    json_schema: {
      name: "rpg_world_primer",
      strict: true,
      schema: {
        type: "object",
        properties: {
          // Основные параметры мира сохраняются для контекста
          name: { type: "string" },
          genre: { type: "string" },
          tone: { type: "string" },

          // Главный и единственный результат генерации
          world_primer: {
            type: "string",
            description:
              "A cohesive and expanded narrative overview of the world, integrating brief descriptions of races, history, factions, and locations as requested. This text serves as the foundation for future detailed generation.",
          },
          ...(data.locationsEnabled
            ? {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: {
                      type: "string",
                      description:
                        "Short description of the location, its importance, and its relationship to the world.",
                    },
                  },
                },
              }
            : null),
          ...(data.racesEnabled
            ? {
                races: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: {
                        type: "string",
                        description:
                          "Short description of the race, its importance, and its relationship to the world.",
                      },
                    },
                  },
                },
              }
            : null),
          ...(data.factionsEnabled
            ? {
                factions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                    },
                  },
                },
              }
            : null),
          ...(data.timelineEnabled
            ? {
                history: {
                  type: "string",
                  description:
                    "A concise narrative overview of the world's history, explaining how things got this way.",
                },
              }
            : null),
        },
        required: [
          "name",
          "genre",
          "tone",
          "world_primer",
          ...(data.locationsEnabled ? ["locations"] : []),
          ...(data.racesEnabled ? ["races"] : []),
          ...(data.factionsEnabled ? ["factions"] : []),
          ...(data.timelineEnabled ? ["history"] : []),
        ],
        additionalProperties: false,
      },
    },
  };
};
