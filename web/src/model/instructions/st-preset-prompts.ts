import type { StBasePrompt } from '@shared/types/instructions';

export const ST_SYSTEM_PROMPT_DEFAULTS: StBasePrompt[] = [
	{
		identifier: 'main',
		name: 'Main Prompt',
		system_prompt: true,
		role: 'system',
		content: "Write {{char}}'s next reply in a fictional chat between {{charIfNotGroup}} and {{user}}.",
	},
	{
		identifier: 'nsfw',
		name: 'Auxiliary Prompt',
		system_prompt: true,
		role: 'system',
		content: '',
	},
	{
		identifier: 'dialogueExamples',
		name: 'Chat Examples',
		system_prompt: true,
		marker: true,
	},
	{
		identifier: 'jailbreak',
		name: 'Post-History Instructions',
		system_prompt: true,
		role: 'system',
		content: '',
	},
	{
		identifier: 'chatHistory',
		name: 'Chat History',
		system_prompt: true,
		marker: true,
	},
	{
		identifier: 'worldInfoAfter',
		name: 'World Info (after)',
		system_prompt: true,
		marker: true,
	},
	{
		identifier: 'worldInfoBefore',
		name: 'World Info (before)',
		system_prompt: true,
		marker: true,
	},
	{
		identifier: 'enhanceDefinitions',
		name: 'Enhance Definitions',
		system_prompt: true,
		role: 'system',
		content:
			"If you have more knowledge of {{char}}, add to the character's lore and personality to enhance them but keep the Character Sheet's definitions absolute.",
		marker: false,
	},
	{
		identifier: 'charDescription',
		name: 'Char Description',
		system_prompt: true,
		marker: true,
	},
	{
		identifier: 'charPersonality',
		name: 'Char Personality',
		system_prompt: true,
		marker: true,
	},
	{
		identifier: 'scenario',
		name: 'Scenario',
		system_prompt: true,
		marker: true,
	},
	{
		identifier: 'personaDescription',
		name: 'Persona Description',
		system_prompt: true,
		marker: true,
	},
];

export const ST_PROMPT_SOURCE_LABELS: Partial<Record<string, string>> = {
	charDescription: 'Character Description',
	charPersonality: 'Character Personality',
	scenario: 'Character Scenario',
	personaDescription: 'Persona Description',
	worldInfoBefore: 'World Info (before character)',
	worldInfoAfter: 'World Info (after character)',
	dialogueExamples: 'Dialogue Examples',
	chatHistory: 'Chat History',
};
