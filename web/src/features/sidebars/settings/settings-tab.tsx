import { Stack } from '@mantine/core';
import { type SamplerItemSettingsType, type SamplersItemType } from '@shared/types/samplers';
import { useUnit } from 'effector-react';
import React, { useEffect, useMemo, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { createEmptySampler, samplersModel } from '@model/samplers';
import { IMPORT_FILE_ICON, EXPORT_FILE_ICON } from '@ui/file-transfer-icons';
import { IconButtonWithTooltip } from '@ui/icon-button-with-tooltip';
import { toaster } from '@ui/toaster';

import { downloadBlobFile, exportBundle, importBundle } from '../../../api/bundles';
import { getLlmSettingsFields } from '../../../model/llm-settings';
import { SamplerSettingsGrid } from '../../llm-provider/sampler-settings-grid';
import { resolveBundleAutoApplyTargets } from '../common/bundle-helpers';

import { PresetControls } from './preset-controls';

function hasDirtyFields(value: unknown): boolean {
	if (value === true) return true;
	if (Array.isArray(value)) return value.some((item) => hasDirtyFields(item));
	if (value && typeof value === 'object') {
		return Object.values(value as Record<string, unknown>).some((item) => hasDirtyFields(item));
	}
	return false;
}

export const SamplerSettingsTab: React.FC = () => {
	const { t } = useTranslation();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [settings, items, loadItems, loadSettings, updateSettings, createItem, updateItem, deleteItem] = useUnit([
		samplersModel.$settings,
		samplersModel.$items,
		samplersModel.getItemsFx,
		samplersModel.getSettingsFx,
		samplersModel.updateSettingsFx,
		samplersModel.createItemFx,
		samplersModel.updateItemFx,
		samplersModel.deleteItemFx,
	]);
	const selectedItem = useMemo(() => items.find((item) => item.id === settings?.selectedId) ?? null, [items, settings?.selectedId]);
	const llmSettingsFields = getLlmSettingsFields(t);

	const methods = useForm<SamplerItemSettingsType>({
		defaultValues: selectedItem?.settings,
	});
	const { control, getValues, reset, formState } = methods;
	const hasUnsavedChanges = hasDirtyFields(formState.dirtyFields);

	useEffect(() => {
		reset(selectedItem?.settings);
	}, [reset, selectedItem]);

	const handleSave = () => {
		if (!selectedItem) return;
		const newItem = { ...selectedItem, settings: getValues() } as SamplersItemType;
		void updateItem(newItem);
	};

	const askValue = (prompt: string, defaultValue: string): string | null => {
		const value = window.prompt(prompt, defaultValue)?.trim();
		return value && value.length > 0 ? value : null;
	};

	const handleCreate = () => {
		const name = askValue(t('llmSettings.actions.createPrompt'), t('llmSettings.defaults.newPresetName'));
		if (!name) return;
		void createItem({
			...createEmptySampler(getValues()),
			name,
		});
	};

	const handleSelectPreset = (selectedId: string | null) => {
		const currentSelectedId = settings?.selectedId ?? null;
		if (currentSelectedId === selectedId) return;
		if (hasUnsavedChanges && !window.confirm(t('llmSettings.confirm.discardChanges'))) {
			return;
		}
		void updateSettings({ selectedId: selectedId ?? null });
	};

	const handleRename = () => {
		if (!selectedItem) return;
		const name = window.prompt(t('llmSettings.actions.renamePrompt'), selectedItem.name)?.trim();
		if (!name) return;
		void updateItem({ ...selectedItem, name });
	};

	const handleDuplicate = () => {
		if (!selectedItem) return;
		void createItem({
			...createEmptySampler(getValues()),
			name: `${selectedItem.name} copy`,
		});
	};

	const handleDelete = () => {
		if (!selectedItem) return;
		if (!window.confirm(t('llmSettings.confirm.delete'))) return;
		void deleteItem({ id: selectedItem.id, skipConfirm: true });
	};

	const handleExport = async () => {
		if (!selectedItem) return;
		try {
			const exported = await exportBundle({
				source: { kind: 'sampler_preset', id: selectedItem.id },
				selections: [{ kind: 'sampler_preset', id: selectedItem.id }],
				format: 'auto',
			});
			downloadBlobFile(exported.filename, exported.blob);
			toaster.success({ title: t('llmSettings.toasts.exportDone'), description: selectedItem.name });
		} catch (error) {
			toaster.error({
				title: t('llmSettings.toasts.exportFailed'),
				description: error instanceof Error ? error.message : String(error),
			});
		}
	};

	const handleImport = async (file: File | null) => {
		if (!file) return;
		try {
			const imported = await importBundle(file);
			await Promise.all([loadItems(), loadSettings()]);
			const applyTargets = resolveBundleAutoApplyTargets(imported);
			if (applyTargets.samplerPresetId) {
				await updateSettings({ selectedId: applyTargets.samplerPresetId });
			}
			if (applyTargets.warnings.length > 0) {
				toaster.warning({
					title: t('llmSettings.toasts.importWarning'),
					description: applyTargets.warnings.join(' '),
				});
			}
			toaster.success({
				title: t('llmSettings.toasts.importDone'),
				description: t('llmSettings.toasts.importedCount', { count: imported.created.samplerPresets.length }),
			});
		} catch (error) {
			toaster.error({
				title: t('llmSettings.toasts.importFailed'),
				description: error instanceof Error ? error.message : String(error),
			});
		}
	};

	const options = items
		.map((item) => ({
			label: String((item as unknown as { name?: unknown })?.name ?? ''),
			value: typeof (item as unknown as { id?: unknown })?.id === 'string' ? (item as unknown as { id: string }).id : '',
		}))
		.filter((o) => Boolean(o.value));

	return (
		<Stack gap="md">
			<input
				ref={fileInputRef}
				type="file"
				accept=".json,.tsbundle"
				style={{ display: 'none' }}
				onChange={(event) => {
					const file = event.currentTarget.files?.[0] ?? null;
					void handleImport(file).finally(() => {
						event.currentTarget.value = '';
					});
				}}
			/>
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
				disableSave={!selectedItem || !hasUnsavedChanges}
				disableDelete={!selectedItem}
				layout="stacked"
				extraActions={
					<>
						<IconButtonWithTooltip
							icon={<IMPORT_FILE_ICON />}
							tooltip={t('llmSettings.actions.import')}
							aria-label={t('llmSettings.actions.import')}
							onClick={() => fileInputRef.current?.click()}
						/>
						<IconButtonWithTooltip
							icon={<EXPORT_FILE_ICON />}
							tooltip={t('llmSettings.actions.export')}
							aria-label={t('llmSettings.actions.export')}
							onClick={() => void handleExport()}
							disabled={!selectedItem}
						/>
					</>
				}
			/>
			<FormProvider {...methods}>
				<SamplerSettingsGrid control={control} fields={llmSettingsFields} columns={1} />
			</FormProvider>
		</Stack>
	);
};
