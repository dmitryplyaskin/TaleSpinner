import { WorldType } from "@shared/types/world";

export const createWorldPrompt = (
  worldType: WorldType,
  userPrompt?: string
) => {
  return `
You are an expert Game Master and world-builder specializing in creating immersive fantasy settings for tabletop role-playing games. Your task is to craft a detailed, believable, and engaging game world that serves as the foundation for interesting adventures.
Your task is to create three short synopses to generate a future full story and lore to build a believable world. Each synopsis should be no longer than 500 words, reveal the main essence of the world, its unique features, and briefly describe the main conflict in the world.

${userPrompt ? `User's Specific Requirements: \n${userPrompt}` : ""}

`;
};
