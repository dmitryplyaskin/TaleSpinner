export type WorldInfoSettingsFieldId =
	| 'scanDepth'
	| 'includeNames'
	| 'caseSensitive'
	| 'matchWholeWords'
	| 'minActivations'
	| 'minDepthMax'
	| 'recursive'
	| 'maxRecursionSteps'
	| 'useGroupScoring'
	| 'budgetPercent'
	| 'budgetCapTokens'
	| 'contextWindowTokens'
	| 'overflowAlert'
	| 'insertionStrategy';

export type WorldInfoSettingsGroup = {
	id: 'matching' | 'activation' | 'budget' | 'insertion';
	titleKey: string;
	descriptionKey: string;
	fields: WorldInfoSettingsFieldId[];
};

export const WORLD_INFO_SETTINGS_GROUPS: WorldInfoSettingsGroup[] = [
	{
		id: 'matching',
		titleKey: 'worldInfo.settings.groups.matching.title',
		descriptionKey: 'worldInfo.settings.groups.matching.description',
		fields: ['scanDepth', 'includeNames', 'caseSensitive', 'matchWholeWords'],
	},
	{
		id: 'activation',
		titleKey: 'worldInfo.settings.groups.activation.title',
		descriptionKey: 'worldInfo.settings.groups.activation.description',
		fields: ['minActivations', 'minDepthMax', 'recursive', 'maxRecursionSteps', 'useGroupScoring'],
	},
	{
		id: 'budget',
		titleKey: 'worldInfo.settings.groups.budget.title',
		descriptionKey: 'worldInfo.settings.groups.budget.description',
		fields: ['budgetPercent', 'budgetCapTokens', 'contextWindowTokens', 'overflowAlert'],
	},
	{
		id: 'insertion',
		titleKey: 'worldInfo.settings.groups.insertion.title',
		descriptionKey: 'worldInfo.settings.groups.insertion.description',
		fields: ['insertionStrategy'],
	},
];

export function getWorldInfoSettingsFieldIds(groups: WorldInfoSettingsGroup[]): WorldInfoSettingsFieldId[] {
	return groups.flatMap((group) => group.fields);
}
