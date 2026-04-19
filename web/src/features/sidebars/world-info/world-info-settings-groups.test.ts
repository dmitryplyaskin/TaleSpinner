import { describe, expect, test } from 'vitest';

import {
	WORLD_INFO_SETTINGS_GROUPS,
	getWorldInfoSettingsFieldIds,
} from './world-info-settings-groups';

describe('world info settings groups', () => {
	test('keep all settings fields grouped once', () => {
		expect(getWorldInfoSettingsFieldIds(WORLD_INFO_SETTINGS_GROUPS)).toEqual([
			'scanDepth',
			'includeNames',
			'caseSensitive',
			'matchWholeWords',
			'minActivations',
			'minDepthMax',
			'recursive',
			'maxRecursionSteps',
			'useGroupScoring',
			'budgetPercent',
			'budgetCapTokens',
			'contextWindowTokens',
			'overflowAlert',
			'insertionStrategy',
		]);
	});

	test('use unique group and field ids', () => {
		const groupIds = WORLD_INFO_SETTINGS_GROUPS.map((group) => group.id);
		const fieldIds = getWorldInfoSettingsFieldIds(WORLD_INFO_SETTINGS_GROUPS);

		expect(new Set(groupIds).size).toBe(groupIds.length);
		expect(new Set(fieldIds).size).toBe(fieldIds.length);
	});
});
