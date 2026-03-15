import { useTranslation } from 'react-i18next';

import { toaster } from '@ui/toaster';

import { PresetControls } from '../../../../../../settings/preset-controls';
import { buildLlmPresetPayloadFromOperationRuntime, type OperationLlmRuntimeFields } from '../../../../../form/operation-llm-form-utils';

import type { LlmPresetDto } from '../../../../../../../../api/llm';

type Props = {
	presets: LlmPresetDto[];
	selectedPresetId: string;
	runtime: OperationLlmRuntimeFields;
	onPresetSelect: (presetId: string | null) => void;
	onCreatePreset: (params: { name: string; payload: LlmPresetDto['payload'] }) => Promise<LlmPresetDto>;
	onUpdatePreset: (params: {
		presetId: string;
		name?: string;
		description?: string | null;
		payload?: LlmPresetDto['payload'];
	}) => Promise<LlmPresetDto>;
	onDeletePreset: (presetId: string) => Promise<{ id: string }>;
};

export const OperationLlmPresetManager: React.FC<Props> = ({
	presets,
	selectedPresetId,
	runtime,
	onPresetSelect,
	onCreatePreset,
	onUpdatePreset,
	onDeletePreset,
}) => {
	const { t } = useTranslation();
	const activePreset = presets.find((item) => item.presetId === selectedPresetId) ?? null;

	const createPreset = async () => {
		const fallback = t('provider.presets.defaults.newPresetName');
		const rawName = window.prompt(t('provider.presets.actions.createPrompt'), fallback);
		const name = rawName?.trim();
		if (!name) return;

		try {
			const created = await onCreatePreset({
				name,
				payload: buildLlmPresetPayloadFromOperationRuntime(runtime),
			});
			onPresetSelect(created.presetId);
			toaster.success({ title: t('provider.presets.toasts.created'), description: created.name });
		} catch (error) {
			toaster.error({
				title: t('provider.presets.toasts.failed'),
				description: error instanceof Error ? error.message : String(error),
			});
		}
	};

	const savePreset = async () => {
		if (!activePreset) return;
		try {
			await onUpdatePreset({
				presetId: activePreset.presetId,
				payload: buildLlmPresetPayloadFromOperationRuntime(runtime),
			});
			toaster.success({ title: t('provider.presets.toasts.saved'), description: activePreset.name });
		} catch (error) {
			toaster.error({
				title: t('provider.presets.toasts.failed'),
				description: error instanceof Error ? error.message : String(error),
			});
		}
	};

	const renamePreset = async () => {
		if (!activePreset) return;
		const rawName = window.prompt(t('provider.presets.actions.renamePrompt'), activePreset.name);
		const name = rawName?.trim();
		if (!name) return;

		try {
			await onUpdatePreset({ presetId: activePreset.presetId, name });
			toaster.success({ title: t('provider.presets.toasts.saved'), description: name });
		} catch (error) {
			toaster.error({
				title: t('provider.presets.toasts.failed'),
				description: error instanceof Error ? error.message : String(error),
			});
		}
	};

	const duplicatePreset = async () => {
		if (!activePreset) return;

		try {
			const created = await onCreatePreset({
				name: `${activePreset.name} copy`,
				payload: activePreset.payload,
			});
			onPresetSelect(created.presetId);
			toaster.success({ title: t('provider.presets.toasts.created'), description: created.name });
		} catch (error) {
			toaster.error({
				title: t('provider.presets.toasts.failed'),
				description: error instanceof Error ? error.message : String(error),
			});
		}
	};

	const deletePreset = async () => {
		if (!activePreset) return;
		if (!window.confirm(t('provider.presets.confirm.delete'))) return;

		try {
			await onDeletePreset(activePreset.presetId);
			onPresetSelect(null);
			toaster.success({ title: t('provider.presets.toasts.deleted'), description: activePreset.name });
		} catch (error) {
			toaster.error({
				title: t('provider.presets.toasts.failed'),
				description: error instanceof Error ? error.message : String(error),
			});
		}
	};

	return (
		<PresetControls
			layout="stacked"
			labels={{
				title: t('provider.presets.title'),
				active: t('provider.presets.active'),
				create: t('provider.presets.actions.create'),
				rename: t('provider.presets.actions.rename'),
				duplicate: t('provider.presets.actions.duplicate'),
				save: t('provider.presets.actions.save'),
				delete: t('provider.presets.actions.delete'),
			}}
			options={presets.map((item) => ({ value: item.presetId, label: item.name }))}
			value={selectedPresetId || null}
			onChange={(value) => onPresetSelect(value)}
			onCreate={() => void createPreset()}
			onRename={() => void renamePreset()}
			onDuplicate={() => void duplicatePreset()}
			onSave={() => void savePreset()}
			onDelete={() => void deletePreset()}
			disableRename={!activePreset}
			disableDuplicate={!activePreset}
			disableSave={!activePreset}
			disableDelete={!activePreset}
		/>
	);
};
