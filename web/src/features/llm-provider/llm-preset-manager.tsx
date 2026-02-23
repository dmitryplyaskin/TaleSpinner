import { Button, Group, Select, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { toaster } from '@ui/toaster';

import type { LlmPresetDto, LlmPresetSettingsDto } from '../../api/llm';
import type { LlmPresetPayload } from '@shared/types/llm';

type Props = {
	presets: LlmPresetDto[];
	presetSettings: LlmPresetSettingsDto | null;
	buildCurrentPayload: () => LlmPresetPayload;
	onCreatePreset: (params: { name: string; payload: LlmPresetPayload }) => Promise<LlmPresetDto>;
	onUpdatePreset: (params: { presetId: string; name?: string; description?: string | null; payload?: LlmPresetPayload }) => Promise<LlmPresetDto>;
	onDeletePreset: (presetId: string) => Promise<{ id: string }>;
	onSelectPreset: (presetId: string | null, options?: { skipUnsavedConfirm?: boolean }) => Promise<void> | void;
	onPatchSettings: (params: { activePresetId?: string | null }) => Promise<LlmPresetSettingsDto>;
};

function resolveCopyName(base: string, used: Set<string>): string {
	const trimmed = base.trim() || 'Preset';
	if (!used.has(trimmed)) return trimmed;
	for (let idx = 2; idx < 10000; idx += 1) {
		const candidate = `${trimmed} ${idx}`;
		if (!used.has(candidate)) return candidate;
	}
	return `${trimmed} ${Date.now()}`;
}

export const LlmPresetManager: React.FC<Props> = ({
	presets,
	presetSettings,
	buildCurrentPayload,
	onCreatePreset,
	onUpdatePreset,
	onDeletePreset,
	onSelectPreset,
	onPatchSettings,
}) => {
	const { t } = useTranslation();

	const activePresetId = presetSettings?.activePresetId ?? null;
	const activePreset = presets.find((item) => item.presetId === activePresetId) ?? null;
	const options = presets.map((item) => ({ value: item.presetId, label: item.name }));

	const createPreset = async () => {
		const fallback = t('provider.presets.defaults.newPresetName');
		const rawName = window.prompt(t('provider.presets.actions.createPrompt'), fallback);
		const name = rawName?.trim();
		if (!name) return;
		try {
			const created = await onCreatePreset({
				name,
				payload: buildCurrentPayload(),
			});
			await onSelectPreset(created.presetId, { skipUnsavedConfirm: true });
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
				payload: buildCurrentPayload(),
			});
			toaster.success({ title: t('provider.presets.toasts.saved'), description: activePreset.name });
		} catch (error) {
			toaster.error({
				title: t('provider.presets.toasts.failed'),
				description: error instanceof Error ? error.message : String(error),
			});
		}
	};

	const duplicatePreset = async () => {
		try {
			const source = activePreset;
			if (!source) return;
			const used = new Set(presets.map((item) => item.name));
			const name = resolveCopyName(`${source.name} (copy)`, used);
			const created = await onCreatePreset({
				name,
				payload: source.payload,
			});
			await onSelectPreset(created.presetId, { skipUnsavedConfirm: true });
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
			if (activePresetId === activePreset.presetId) {
				await onPatchSettings({ activePresetId: null });
			}
			toaster.success({ title: t('provider.presets.toasts.deleted'), description: activePreset.name });
		} catch (error) {
			toaster.error({
				title: t('provider.presets.toasts.failed'),
				description: error instanceof Error ? error.message : String(error),
			});
		}
	};

	const renamePreset = async () => {
		if (!activePreset) return;
		const name = window.prompt(t('provider.presets.actions.renamePrompt'), activePreset.name)?.trim();
		if (!name) return;
		try {
			await onUpdatePreset({
				presetId: activePreset.presetId,
				name,
			});
			toaster.success({ title: t('provider.presets.toasts.saved'), description: name });
		} catch (error) {
			toaster.error({
				title: t('provider.presets.toasts.failed'),
				description: error instanceof Error ? error.message : String(error),
			});
		}
	};

	return (
		<Stack gap="xs">
			<Text fw={600}>{t('provider.presets.title')}</Text>
			<Select
				label={t('provider.presets.active')}
				data={options}
				value={activePresetId}
				onChange={(value) => void onSelectPreset(value ?? null)}
				clearable
				searchable
				comboboxProps={{ withinPortal: false }}
			/>
			<Group gap="xs">
				<Button size="xs" variant="light" onClick={() => void createPreset()}>
					{t('provider.presets.actions.create')}
				</Button>
				<Button size="xs" variant="outline" onClick={() => void savePreset()} disabled={!activePreset}>
					{t('provider.presets.actions.save')}
				</Button>
				<Button size="xs" variant="default" onClick={() => void renamePreset()} disabled={!activePreset}>
					{t('provider.presets.actions.rename')}
				</Button>
				<Button size="xs" variant="default" onClick={() => void duplicatePreset()} disabled={!activePreset}>
					{t('provider.presets.actions.duplicate')}
				</Button>
				<Button size="xs" color="red" variant="light" onClick={() => void deletePreset()} disabled={!activePreset}>
					{t('provider.presets.actions.delete')}
				</Button>
			</Group>
		</Stack>
	);
};
