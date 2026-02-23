import { Button, Group, Select, Stack } from '@mantine/core';
import { type SamplerItemSettingsType, type SamplersItemType } from '@shared/types/samplers';
import { useUnit } from 'effector-react';
import React, { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuCopy, LuPencil, LuPlus, LuSave, LuTrash2 } from 'react-icons/lu';

import { createEmptySampler, samplersModel } from '@model/samplers';

import { getLlmSettingsFields } from '../../../model/llm-settings';
import { SamplerSettingsGrid } from '../../llm-provider/sampler-settings-grid';

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

	const options = items
		.map((item) => ({
			label: String((item as unknown as { name?: unknown })?.name ?? ''),
			value: typeof (item as unknown as { id?: unknown })?.id === 'string' ? (item as unknown as { id: string }).id : '',
		}))
		.filter((o) => Boolean(o.value));

	return (
		<Stack gap="md">
			<Group gap="md" align="flex-end">
				<Select
					data={options}
					value={settings?.selectedId ?? null}
					onChange={(selectedId) => handleSelectPreset(selectedId ?? null)}
					placeholder={t('llmSettings.selectSampler')}
					comboboxProps={{ withinPortal: false }}
					style={{ flex: 1 }}
				/>
				<Group gap="xs">
					<Button leftSection={<LuPlus />} size="xs" variant="light" onClick={() => samplersModel.createItemFx(createEmptySampler(getValues()))}>
						{t('llmSettings.actions.create')}
					</Button>
					<Button leftSection={<LuPencil />} size="xs" variant="default" onClick={handleRename} disabled={!selectedItem}>
						{t('llmSettings.actions.rename')}
					</Button>
					<Button leftSection={<LuCopy />} size="xs" variant="default" onClick={handleDuplicate} disabled={!selectedItem}>
						{t('llmSettings.actions.duplicate')}
					</Button>
					<Button leftSection={<LuSave />} size="xs" variant="filled" onClick={handleSave} disabled={!selectedItem || !formState.isDirty}>
						{t('llmSettings.actions.save')}
					</Button>
					<Button
						leftSection={<LuTrash2 />}
						size="xs"
						color="red"
						variant="light"
						disabled={!settings.selectedId}
						onClick={() => samplersModel.deleteItemFx(settings.selectedId as string)}
					>
						{t('llmSettings.actions.delete')}
					</Button>
				</Group>
			</Group>

			<FormProvider {...methods}>
				<SamplerSettingsGrid control={control} fields={llmSettingsFields} columns={1} />
			</FormProvider>
		</Stack>
	);
};
