import { OpenAI } from "openai";

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

export const createWorldsResponseFormat: OpenAI.ResponseFormatJSONSchema = {
  type: "json_schema",
  json_schema: {
    name: "rpg_worlds",
    strict: true,
    schema: {
      type: "object",
    },
  },
};
