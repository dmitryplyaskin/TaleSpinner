import { type SamplerItemSettingsType, type SamplersItemType, type SamplersSettingsType } from '@shared/types/samplers';
import { v4 as uuidv4 } from 'uuid';

import { createModel } from '@model/_fabric_';

export const samplersModel = createModel<SamplersSettingsType, SamplersItemType>({
	settings: {
		route: '/settings/samplers',
	},

	items: {
		route: '/samplers',
	},
	fabricName: 'samplers',
});

export const createEmptySampler = (
	value: SamplerItemSettingsType = {} as SamplerItemSettingsType,
): SamplersItemType => ({
	id: uuidv4(),
	name: 'New preset',
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	settings: {
		temperature: 1,
		topP: 1,
		topK: 0,
		frequencyPenalty: 0,
		presencePenalty: 0,
		repetitionPenalty: 1,
		minP: 0,
		topA: 0,
		maxTokens: 0,
		seed: 0,
		reasoning: {
			enabled: false,
			effort: 'medium',
			maxTokens: 0,
			exclude: false,
		},
		...value,
	},
});
