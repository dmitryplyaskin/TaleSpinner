import { Stack } from '@mantine/core';
import { type SamplerItemSettingsType, type SamplersItemType } from '@shared/types/samplers';
import { useUnit } from 'effector-react';
import React, { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { createEmptySampler, samplersModel } from '@model/samplers';

import { getLlmSettingsFields } from '../../../model/llm-settings';
import { SamplerSettingsGrid } from '../../llm-provider/sampler-settings-grid';

import { PresetControls } from './preset-controls';

export const SamplerSettingsTab: React.FC = () => {
	const { t } = useTranslation();
	const settings = useUnit(samplersModel.$settings);
	const items = useUnit(samplersModel.$items);
	const selectedItem = useMemo(
		() => items.find((item) => item.id === settings.selectedId) ?? null,
		[items, settings.selectedId],
	);
	const llmSettingsFields = getLlmSettingsFields(t);

	const methods = useForm<SamplerItemSettingsType>({
		defaultValues: selectedItem?.settings,
	});
	const { control, getValues, reset, formState } = methods;

	useEffect(() => {
		reset(selectedItem?.settings);
	}, [reset, selectedItem]);

	const handleSave = () => {
		if (!selectedItem) return;
		const newItem = { ...selectedItem, settings: getValues() } as SamplersItemType;

		samplersModel.updateItemFx(newItem);
	};

	const askValue = (prompt: string, defaultValue: string): string | null => {
		const value = window.prompt(prompt, defaultValue)?.trim();
		return value && value.length > 0 ? value : null;
	};

	const handleCreate = () => {
		const name = askValue(t('llmSettings.actions.createPrompt'), t('llmSettings.defaults.newPresetName'));
		if (!name) return;
		samplersModel.createItemFx({
			...createEmptySampler(getValues()),
			name,
		});
	};

	const handleSelectPreset = (selectedId: string | null) => {
		const currentSelectedId = settings?.selectedId ?? null;
		if (currentSelectedId === selectedId) return;
		if (formState.isDirty && !window.confirm(t('llmSettings.confirm.discardChanges'))) {
			return;
		}
		samplersModel.updateSettingsFx({ ...(settings ?? {}), selectedId: selectedId ?? null });
	};

	const handleRename = () => {
		if (!selectedItem) return;
		const name = window.prompt(t('llmSettings.actions.renamePrompt'), selectedItem.name)?.trim();
		if (!name) return;
		samplersModel.updateItemFx({ ...selectedItem, name });
	};

	const handleDuplicate = () => {
		if (!selectedItem) return;
		samplersModel.createItemFx({
			...createEmptySampler(getValues()),
			name: `${selectedItem.name} copy`,
		});
	};

	const handleDelete = () => {
		if (!selectedItem) return;
		if (!window.confirm(t('llmSettings.confirm.delete'))) return;
		samplersModel.deleteItemFx({ id: selectedItem.id, skipConfirm: true });
	};

	const options = items
		.map((item) => ({
			label: String((item as unknown as { name?: unknown })?.name ?? ''),
			value: typeof (item as unknown as { id?: unknown })?.id === 'string' ? (item as unknown as { id: string }).id : '',
		}))
		.filter((o) => Boolean(o.value));

	return (
		<Stack gap="md">
			<PresetControls
				labels={{
					title: t('llmSettings.presets.title'),
					active: t('llmSettings.presets.active'),
					create: t('llmSettings.actions.create'),
					rename: t('llmSettings.actions.rename'),
					duplicate: t('llmSettings.actions.duplicate'),
					save: t('llmSettings.actions.save'),
					delete: t('llmSettings.actions.delete'),
				}}
				options={options}
				value={settings?.selectedId ?? null}
				onChange={(selectedId) => handleSelectPreset(selectedId ?? null)}
				onCreate={handleCreate}
				onRename={handleRename}
				onDuplicate={handleDuplicate}
				onSave={handleSave}
				onDelete={handleDelete}
				disableRename={!selectedItem}
				disableDuplicate={!selectedItem}
				disableSave={!selectedItem || !formState.isDirty}
				disableDelete={!selectedItem}
			/>

			<FormProvider {...methods}>
				<SamplerSettingsGrid control={control} fields={llmSettingsFields} columns={1} />
			</FormProvider>
		</Stack>
	);
};
