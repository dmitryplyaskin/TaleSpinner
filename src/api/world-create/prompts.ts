import { WorldType } from "@shared/types/world";

export const createWorldPrompt = (
  worldType: WorldType,
  userPrompt?: string
) => {
  const worldTypePrompt = `
    World type: ${worldType}
  `;

  return `
    You are a world creator.
    You are given a world type and a user prompt.
    You need to create a world based on the world type and the user prompt.
    ${worldTypePrompt}
    ${userPrompt ? `User prompt: ${userPrompt}` : ""}
  `;
};
