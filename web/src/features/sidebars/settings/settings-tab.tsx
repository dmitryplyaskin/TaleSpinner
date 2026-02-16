import { Flex, Select } from '@mantine/core';
import { type SamplerItemSettingsType, type SamplersItemType } from '@shared/types/samplers';
import { useUnit } from 'effector-react';
import React, { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuCopy, LuPlus, LuSave, LuTrash2 } from 'react-icons/lu';

import { createEmptySampler, samplersModel } from '@model/samplers';
import { IconButtonWithTooltip } from '@ui/icon-button-with-tooltip';

import { getLlmSettingsFields } from '../../../model/llm-settings';
import { SamplerSettingsGrid } from '../../llm-provider/sampler-settings-grid';





export interface LLMSettings {
	temperature: number;
	maxTokens: number;
	topP: number;
	frequencyPenalty: number;
	presencePenalty: number;
}

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
	const { control, getValues, reset, watch } = methods;

	useEffect(() => {
		reset(selectedItem?.settings);
	}, [reset, selectedItem]);

	const handleSave = () => {
		if (!selectedItem) return;
		const newItem = { ...selectedItem, settings: getValues() } as SamplersItemType;

		samplersModel.updateItemFx(newItem);
	};

	useEffect(() => {
		const subscription = watch((data) => {
			if (!selectedItem) return;
			const newItem = { ...selectedItem, settings: data as SamplerItemSettingsType } as SamplersItemType;

			samplersModel.changeItemDebounced(newItem);
		});
		return () => {
			subscription.unsubscribe();
		};
	}, [selectedItem, watch]);

	const options = items
		.map((item) => ({
			label: String((item as unknown as { name?: unknown })?.name ?? ''),
			value: typeof (item as unknown as { id?: unknown })?.id === 'string' ? (item as unknown as { id: string }).id : '',
		}))
		.filter((o) => Boolean(o.value));

	return (
		<Flex direction="column" gap="md">
			<Flex gap="md" align="flex-end">
				<Select
					data={options}
					value={settings?.selectedId ?? null}
					onChange={(selectedId) => samplersModel.updateSettingsFx({ ...settings, selectedId: selectedId ?? null })}
					placeholder={t('llmSettings.selectSampler')}
					comboboxProps={{ withinPortal: false }}
					style={{ flex: 1 }}
				/>
				<Flex gap="xs">
					<IconButtonWithTooltip
						tooltip={t('llmSettings.actions.save')}
						icon={<LuSave />}
						aria-label={t('llmSettings.actions.save')}
						onClick={handleSave}
					/>
					<IconButtonWithTooltip
						tooltip={t('llmSettings.actions.create')}
						icon={<LuPlus />}
						aria-label={t('llmSettings.actions.create')}
						onClick={() => samplersModel.createItemFx(createEmptySampler(getValues()))}
					/>
					<IconButtonWithTooltip
						tooltip={t('llmSettings.actions.duplicate')}
						icon={<LuCopy />}
						aria-label={t('llmSettings.actions.duplicate')}
						disabled={!settings.selectedId}
						onClick={() => selectedItem && samplersModel.duplicateItemFx(selectedItem)}
					/>

					<IconButtonWithTooltip
						tooltip={t('llmSettings.actions.delete')}
						icon={<LuTrash2 />}
						aria-label={t('llmSettings.actions.delete')}
						disabled={!settings.selectedId}
						onClick={() => samplersModel.deleteItemFx(settings.selectedId as string)}
					/>
				</Flex>
			</Flex>

			<FormProvider {...methods}>
				<SamplerSettingsGrid control={control} fields={llmSettingsFields} />
			</FormProvider>
		</Flex>
	);
};
