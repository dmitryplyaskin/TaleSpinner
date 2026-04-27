import { Button, NumberInput, Select, Stack, Switch, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import {
	WORLD_INFO_SETTINGS_GROUPS,
	type WorldInfoSettingsGroup,
} from './world-info-settings-groups';

import type { WorldInfoSettingsDto } from '../../../api/world-info';

type SettingsDraft = Partial<WorldInfoSettingsDto>;
type DraftChangeHandler = (updater: (prev: SettingsDraft | null) => SettingsDraft) => void;

type Props = {
	settingsDraft: SettingsDraft | null;
	isBusy: boolean;
	isSaveSettingsPending: boolean;
	onDraftChange: DraftChangeHandler;
	onSave: () => void;
};

type FieldGroupProps = {
	settingsDraft: SettingsDraft;
	updateDraft: (patch: SettingsDraft) => void;
	onDraftChange: DraftChangeHandler;
};

function parseNumberInput(value: string | number, fallback: number): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	return fallback;
}

function MatchingSettingsFields({ settingsDraft, updateDraft }: FieldGroupProps) {
	const { t } = useTranslation();

	return (
		<Stack gap="sm">
			<NumberInput
				label={t('worldInfo.settings.scanDepth')}
				min={0}
				value={settingsDraft.scanDepth ?? 0}
				onChange={(value) => updateDraft({ scanDepth: parseNumberInput(value, 0) })}
			/>
			<Switch
				label={t('worldInfo.settings.includeNames')}
				checked={Boolean(settingsDraft.includeNames)}
				onChange={(event) => updateDraft({ includeNames: event.currentTarget.checked })}
			/>
			<Switch
				label={t('worldInfo.settings.caseSensitive')}
				checked={Boolean(settingsDraft.caseSensitive)}
				onChange={(event) => updateDraft({ caseSensitive: event.currentTarget.checked })}
			/>
			<Switch
				label={t('worldInfo.settings.matchWholeWords')}
				checked={Boolean(settingsDraft.matchWholeWords)}
				onChange={(event) => updateDraft({ matchWholeWords: event.currentTarget.checked })}
			/>
		</Stack>
	);
}

function ActivationSettingsFields({ settingsDraft, updateDraft, onDraftChange }: FieldGroupProps) {
	const { t } = useTranslation();

	return (
		<Stack gap="sm">
			<NumberInput
				label={t('worldInfo.settings.minActivations')}
				min={0}
				value={settingsDraft.minActivations ?? 0}
				onChange={(value) => {
					const minActivations = parseNumberInput(value, 0);
					onDraftChange((prev) => ({
						...(prev ?? {}),
						minActivations,
						maxRecursionSteps: minActivations > 0 ? 0 : (prev?.maxRecursionSteps ?? 0),
					}));
				}}
			/>
			<NumberInput
				label={t('worldInfo.settings.minDepthMax')}
				min={0}
				value={settingsDraft.minDepthMax ?? settingsDraft.minActivationsDepthMax ?? 0}
				onChange={(value) => updateDraft({ minDepthMax: parseNumberInput(value, 0) })}
			/>
			<Switch
				label={t('worldInfo.settings.recursive')}
				checked={Boolean(settingsDraft.recursive)}
				onChange={(event) => updateDraft({ recursive: event.currentTarget.checked })}
			/>
			<NumberInput
				label={t('worldInfo.settings.maxRecursionSteps')}
				min={0}
				value={settingsDraft.maxRecursionSteps ?? 0}
				onChange={(value) => {
					const maxRecursionSteps = parseNumberInput(value, 0);
					onDraftChange((prev) => ({
						...(prev ?? {}),
						maxRecursionSteps,
						minActivations: maxRecursionSteps > 0 ? 0 : (prev?.minActivations ?? 0),
					}));
				}}
			/>
			<Switch
				label={t('worldInfo.settings.useGroupScoring')}
				checked={Boolean(settingsDraft.useGroupScoring)}
				onChange={(event) => updateDraft({ useGroupScoring: event.currentTarget.checked })}
			/>
		</Stack>
	);
}

function BudgetSettingsFields({ settingsDraft, updateDraft }: FieldGroupProps) {
	const { t } = useTranslation();

	return (
		<Stack gap="sm">
			<NumberInput
				label={t('worldInfo.settings.budgetPercent')}
				min={1}
				max={100}
				value={settingsDraft.budgetPercent ?? 25}
				onChange={(value) => updateDraft({ budgetPercent: parseNumberInput(value, 25) })}
			/>
			<NumberInput
				label={t('worldInfo.settings.budgetCapTokens')}
				min={0}
				value={settingsDraft.budgetCapTokens ?? 0}
				onChange={(value) => updateDraft({ budgetCapTokens: parseNumberInput(value, 0) })}
			/>
			<NumberInput
				label={t('worldInfo.settings.contextWindowTokens')}
				min={1}
				value={settingsDraft.contextWindowTokens ?? 8192}
				onChange={(value) => updateDraft({ contextWindowTokens: parseNumberInput(value, 8192) })}
			/>
			<Switch
				label={t('worldInfo.settings.overflowAlert')}
				checked={Boolean(settingsDraft.overflowAlert)}
				onChange={(event) => updateDraft({ overflowAlert: event.currentTarget.checked })}
			/>
		</Stack>
	);
}

function InsertionSettingsFields({ settingsDraft, updateDraft }: FieldGroupProps) {
	const { t } = useTranslation();

	return (
		<Select
			label={t('worldInfo.settings.insertionStrategy')}
			data={[
				{ value: '0', label: t('worldInfo.settings.insertionStrategyEvenly') },
				{ value: '1', label: t('worldInfo.settings.insertionStrategyCharacterFirst') },
				{ value: '2', label: t('worldInfo.settings.insertionStrategyGlobalFirst') },
			]}
			value={String(settingsDraft.insertionStrategy ?? settingsDraft.characterStrategy ?? 1)}
			onChange={(value) => updateDraft({ insertionStrategy: (Number(value) || 0) as 0 | 1 | 2 })}
			comboboxProps={{ withinPortal: false }}
		/>
	);
}

function WorldInfoSettingsGroupFields(props: FieldGroupProps & { group: WorldInfoSettingsGroup }) {
	switch (props.group.id) {
		case 'matching':
			return <MatchingSettingsFields {...props} />;
		case 'activation':
			return <ActivationSettingsFields {...props} />;
		case 'budget':
			return <BudgetSettingsFields {...props} />;
		case 'insertion':
			return <InsertionSettingsFields {...props} />;
		default:
			return null;
	}
}

export function WorldInfoSettingsPanel({
	settingsDraft,
	isBusy,
	isSaveSettingsPending,
	onDraftChange,
	onSave,
}: Props) {
	const { t } = useTranslation();

	const updateDraft = (patch: SettingsDraft) => {
		onDraftChange((prev) => ({ ...(prev ?? {}), ...patch }));
	};

	if (!settingsDraft) {
		return (
			<Text size="sm" c="dimmed">
				{t('worldInfo.settings.notLoaded')}
			</Text>
		);
	}

	return (
		<Stack gap="md">
			{WORLD_INFO_SETTINGS_GROUPS.map((group) => (
				<Stack key={group.id} gap="xs">
					<Stack gap={2}>
						<Text size="sm" fw={600}>
							{t(group.titleKey)}
						</Text>
						<Text size="xs" c="dimmed">
							{t(group.descriptionKey)}
						</Text>
					</Stack>
					<WorldInfoSettingsGroupFields
						group={group}
						settingsDraft={settingsDraft}
						updateDraft={updateDraft}
						onDraftChange={onDraftChange}
					/>
				</Stack>
			))}
			<Button onClick={onSave} loading={isSaveSettingsPending} disabled={isBusy}>
				{t('worldInfo.actions.saveSettings')}
			</Button>
		</Stack>
	);
}
