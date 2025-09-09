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
  const properties: any = {
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
  };

  const required = ["name", "genre", "tone", "world_primer"];

  // Добавляем опциональные поля только если они включены
  if (data.locationsEnabled) {
    properties.locations = {
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
    };
    required.push("locations");
  }

  if (data.racesEnabled) {
    properties.races = {
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
    };
    required.push("races");
  }

  if (data.factionsEnabled) {
    properties.factions = {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
      },
    };
    required.push("factions");
  }

  if (data.timelineEnabled) {
    properties.history = {
      type: "string",
      description:
        "A concise narrative overview of the world's history, explaining how things got this way.",
    };
    required.push("history");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: "rpg_world_primer",
      strict: true,
      schema: {
        type: "object",
        properties,
        required,
        additionalProperties: false,
      },
    },
  };
};

// Форматы ответов для отдельных элементов мира
export const createRacesResponseFormat: OpenAI.ResponseFormatJSONSchema = {
  type: "json_schema",
  json_schema: {
    name: "world_races",
    strict: true,
    schema: {
      type: "object",
      properties: {
        races: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: {
                type: "string",
                description:
                  "Detailed description of the race's appearance, culture, and characteristics",
              },
              relationship_to_conflict: {
                type: "string",
                description:
                  "How this race relates to the world's central conflict",
              },
              special_abilities: {
                type: "string",
                description: "Unique abilities or characteristics of this race",
              },
              social_structure: {
                type: "string",
                description: "Social organization and place in the world",
              },
            },
            required: [
              "name",
              "description",
              "relationship_to_conflict",
              "special_abilities",
              "social_structure",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["races"],
      additionalProperties: false,
    },
  },
};

export const createTimelineResponseFormat: OpenAI.ResponseFormatJSONSchema = {
  type: "json_schema",
  json_schema: {
    name: "world_timeline",
    strict: true,
    schema: {
      type: "object",
      properties: {
        historical_events: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              timeframe: {
                type: "string",
                description: "When this event occurred (if applicable)",
              },
              description: {
                type: "string",
                description:
                  "Detailed description of the historical event or period",
              },
              impact_on_present: {
                type: "string",
                description:
                  "How this event shaped the current state of the world",
              },
            },
            required: ["name", "timeframe", "description", "impact_on_present"],
            additionalProperties: false,
          },
          minItems: 5,
          maxItems: 7,
        },
      },
      required: ["historical_events"],
      additionalProperties: false,
    },
  },
};

export const createMagicResponseFormat: OpenAI.ResponseFormatJSONSchema = {
  type: "json_schema",
  json_schema: {
    name: "world_magic",
    strict: true,
    schema: {
      type: "object",
      properties: {
        magic_fundamentals: {
          type: "string",
          description: "What magic is in this world and how it works",
        },
        power_sources: {
          type: "string",
          description: "Sources of magical power",
        },
        magic_schools: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: {
                type: "string",
                description: "Description of this school or type of magic",
              },
            },
            required: ["name", "description"],
            additionalProperties: false,
          },
          minItems: 3,
          maxItems: 5,
        },
        limitations_and_costs: {
          type: "string",
          description: "Limitations and prices of using magic",
        },
        societal_attitude: {
          type: "string",
          description: "How society views magic and mages",
        },
        role_in_conflict: {
          type: "string",
          description: "Role of magic in the world's central conflict",
        },
        artifacts_and_places: {
          type: "string",
          description: "Known magical artifacts or places of power",
        },
      },
      required: [
        "magic_fundamentals",
        "power_sources",
        "magic_schools",
        "limitations_and_costs",
        "societal_attitude",
        "role_in_conflict",
        "artifacts_and_places",
      ],
      additionalProperties: false,
    },
  },
};

export const createLocationsResponseFormat: OpenAI.ResponseFormatJSONSchema = {
  type: "json_schema",
  json_schema: {
    name: "world_locations",
    strict: true,
    schema: {
      type: "object",
      properties: {
        locations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: {
                type: "string",
                description:
                  "Type of location (city, ruins, natural area, etc.)",
              },
              appearance: {
                type: "string",
                description:
                  "Detailed description of the location's appearance",
              },
              history: {
                type: "string",
                description: "History of this location",
              },
              inhabitants: {
                type: "string",
                description: "Current inhabitants and their activities",
              },
              significance: {
                type: "string",
                description: "Importance to the world's central conflict",
              },
              features_and_secrets: {
                type: "string",
                description: "Interesting features or secrets of this location",
              },
              adventure_opportunities: {
                type: "string",
                description: "Opportunities for adventures in this location",
              },
            },
            required: [
              "name",
              "type",
              "appearance",
              "history",
              "inhabitants",
              "significance",
              "features_and_secrets",
              "adventure_opportunities",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["locations"],
      additionalProperties: false,
    },
  },
};

export const createFactionsResponseFormat: OpenAI.ResponseFormatJSONSchema = {
  type: "json_schema",
  json_schema: {
    name: "world_factions",
    strict: true,
    schema: {
      type: "object",
      properties: {
        factions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: {
                type: "string",
                description: "Type of organization",
              },
              ideology_and_goals: {
                type: "string",
                description: "Main ideology and objectives of the faction",
              },
              structure: {
                type: "string",
                description: "Organizational structure and hierarchy",
              },
              key_leaders: {
                type: "string",
                description: "Key leaders and their characteristics",
              },
              methods: {
                type: "string",
                description: "Methods used to achieve their goals",
              },
              relationships: {
                type: "string",
                description: "Relationships with other factions",
              },
              role_in_conflict: {
                type: "string",
                description: "Role in the world's central conflict",
              },
              resources_and_influence: {
                type: "string",
                description: "Resources and sphere of influence",
              },
            },
            required: [
              "name",
              "type",
              "ideology_and_goals",
              "structure",
              "key_leaders",
              "methods",
              "relationships",
              "role_in_conflict",
              "resources_and_influence",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["factions"],
      additionalProperties: false,
    },
  },
};

export const createFirstMessageResponseFormat: OpenAI.ResponseFormatJSONSchema =
  {
    type: "json_schema",
    json_schema: {
      // A descriptive name for the schema/function.
      name: "generate_rpg_opening_message",

      // Enforces that the output strictly adheres to the schema.
      strict: true,

      // The core JSON Schema definition.
      schema: {
        type: "object",
        properties: {
          message: {
            type: "array",
            description:
              "An array of message segments that together form the GM's turn.",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  description:
                    "The type of the message segment: 'gm' for game master narration, 'character' for NPC dialogue.",
                  enum: ["gm", "character"],
                },
                content: {
                  type: "string",
                  description:
                    "The text content of the segment. If the type is 'character', this should include the speaker's name.",
                },
              },
              // Each item in the array must have both 'type' and 'content'.
              required: ["type", "content"],
              // Disallow any other properties on the item objects.
              additionalProperties: false,
            },
          },
        },
        // The root object must have the 'message' property.
        required: ["message"],
        // Disallow any other properties on the root object.
        additionalProperties: false,
      },
    },
  };
