import { Button, Divider, Group, Input, Select, Stack, Switch, Text, TextInput } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ragProviderModel } from '@model/rag-provider';
import { toaster } from '@ui/toaster';

import { PresetControls } from './preset-controls';

import type { RagPreset, RagProviderConfig, RagProviderId } from '@shared/types/rag';


const toProviderTokenKey = (providerId: RagProviderId, tokenId: string | null): string => `${providerId}:${tokenId ?? 'none'}`;

const normalizePayload = (payload: RagPreset['payload']) => ({
	activeProviderId: payload.activeProviderId,
	activeTokenId: payload.activeTokenId ?? null,
	activeModel: payload.activeModel ?? null,
	providerConfigsById: {
		openrouter: payload.providerConfigsById.openrouter ?? {},
		ollama: payload.providerConfigsById.ollama ?? {},
	},
});

const isPayloadEqual = (
	left: ReturnType<typeof normalizePayload>,
	right: ReturnType<typeof normalizePayload>,
): boolean => JSON.stringify(left) === JSON.stringify(right);

export const RagSettingsTab = () => {
	const { t } = useTranslation();
	const [providers, runtime, configs, tokens, modelsByProviderTokenKey, presets, presetSettings] = useUnit([
		ragProviderModel.$providers,
		ragProviderModel.$runtime,
		ragProviderModel.$configs,
		ragProviderModel.$tokens,
		ragProviderModel.$modelsByProviderTokenKey,
		ragProviderModel.$presets,
		ragProviderModel.$presetSettings,
	]);

	const [configDraft, setConfigDraft] = useState<RagProviderConfig>({});
	const [modelDraft, setModelDraft] = useState('');

	useEffect(() => {
		ragProviderModel.ragMounted();
	}, []);

	const activeProviderId = runtime?.activeProviderId ?? 'openrouter';
	const activeTokenId = runtime?.activeTokenId ?? null;
	const activeConfig = useMemo(() => configs[activeProviderId] ?? {}, [configs, activeProviderId]);
	const activeModelsKey = toProviderTokenKey(activeProviderId, activeTokenId);
	const activeModels = modelsByProviderTokenKey[activeModelsKey] ?? [];
	const canLoadModels = Boolean(activeTokenId && activeProviderId === 'openrouter');

	useEffect(() => {
		setConfigDraft(activeConfig);
	}, [activeProviderId, activeConfig]);

	useEffect(() => {
		setModelDraft(runtime?.activeModel ?? '');
	}, [runtime?.activeModel]);

	const activeTokens = tokens[activeProviderId] ?? [];

	const providerOptions = providers.map((x) => ({ value: x.id, label: x.name }));
	const tokenOptions = activeTokens.map((x) => ({ value: x.id, label: `${x.name} (${x.tokenHint})` }));
	const modelOptions = activeModels.map((x) => ({ value: x.id, label: x.name }));
	const presetOptions = presets.map((x) => ({ value: x.id, label: x.name }));
	const activePresetId = presetSettings?.selectedId ?? null;
	const activePreset = presets.find((x) => x.id === activePresetId) ?? null;
	const activeProvider = useMemo(() => providers.find((item) => item.id === activeProviderId), [providers, activeProviderId]);

	const buildPayload = () => ({
		activeProviderId,
		activeTokenId: runtime?.activeTokenId ?? null,
		activeModel: runtime?.activeModel ?? null,
		providerConfigsById: {
			openrouter: configs.openrouter ?? {},
			ollama: configs.ollama ?? {},
		},
	});
	const hasUnsavedPresetChanges = activePreset
		? !isPayloadEqual(normalizePayload(activePreset.payload), normalizePayload(buildPayload()))
		: false;
	const hasUnsavedConfigDraft = JSON.stringify(configDraft ?? {}) !== JSON.stringify(activeConfig ?? {});
	const hasUnsavedModelDraft = (modelDraft ?? '').trim() !== (runtime?.activeModel ?? '');
	const hasUnsavedChanges = hasUnsavedPresetChanges || hasUnsavedConfigDraft || hasUnsavedModelDraft;

	const askValue = (prompt: string, defaultValue: string): string | null => {
		const value = window.prompt(prompt, defaultValue)?.trim();
		return value && value.length > 0 ? value : null;
	};

	const applyModelDraft = () => {
		const next = modelDraft.trim();
		ragProviderModel.ragModelSelected(next.length > 0 ? next : null);
	};

	const createPreset = async () => {
		const name = askValue(t('rag.presets.actions.createPrompt'), t('rag.presets.defaults.newPresetName'));
		if (!name) return;
		try {
			await ragProviderModel.createPresetFx({ name, payload: buildPayload() });
		} catch (error) {
			toaster.error({ title: t('provider.presets.toasts.failed'), description: error instanceof Error ? error.message : String(error) });
		}
	};

	const renamePreset = async () => {
		if (!activePreset) return;
		const name = askValue(t('rag.presets.actions.renamePrompt'), activePreset.name);
		if (!name) return;
		try {
			await ragProviderModel.updatePresetFx({ ...activePreset, name });
		} catch (error) {
			toaster.error({ title: t('provider.presets.toasts.failed'), description: error instanceof Error ? error.message : String(error) });
		}
	};

	const duplicatePreset = async () => {
		if (!activePreset) return;
		try {
			await ragProviderModel.createPresetFx({ name: `${activePreset.name} copy`, payload: activePreset.payload });
		} catch (error) {
			toaster.error({ title: t('provider.presets.toasts.failed'), description: error instanceof Error ? error.message : String(error) });
		}
	};

	const deletePreset = async () => {
		if (!activePreset) return;
		if (!window.confirm(t('rag.presets.confirm.delete'))) return;
		try {
			await ragProviderModel.deletePresetFx(activePreset.id);
		} catch (error) {
			toaster.error({ title: t('provider.presets.toasts.failed'), description: error instanceof Error ? error.message : String(error) });
		}
	};

	const savePreset = async () => {
		if (!activePreset) return;
		try {
			await ragProviderModel.updatePresetFx({
				...activePreset,
				payload: buildPayload(),
			});
			toaster.success({ title: t('provider.presets.toasts.saved'), description: activePreset.name });
		} catch (error) {
			toaster.error({ title: t('provider.presets.toasts.failed'), description: error instanceof Error ? error.message : String(error) });
		}
	};

	return (
		<Stack gap="md">
			<PresetControls
				labels={{
					title: t('rag.presets.title'),
					active: t('rag.presets.active'),
					create: t('rag.presets.actions.create'),
					rename: t('rag.presets.actions.rename'),
					duplicate: t('rag.presets.actions.duplicate'),
					save: t('rag.presets.actions.save'),
					delete: t('rag.presets.actions.delete'),
				}}
				options={presetOptions}
				value={activePresetId}
				onChange={(value) => {
					if (value === activePresetId) return;
					if (hasUnsavedChanges && !window.confirm(t('rag.presets.confirm.discardChanges'))) {
						return;
					}
					ragProviderModel.ragPresetSelected(value ?? null);
				}}
				onCreate={() => void createPreset()}
				onRename={() => void renamePreset()}
				onDuplicate={() => void duplicatePreset()}
				onSave={() => void savePreset()}
				onDelete={() => void deletePreset()}
				disableRename={!activePreset}
				disableDuplicate={!activePreset}
				disableSave={!activePreset || !hasUnsavedChanges}
				disableDelete={!activePreset}
			/>

			<Divider />

			<Input.Wrapper label={t('rag.providerLabel')}>
				<Select
					data={providerOptions}
					value={activeProviderId}
					onChange={(value) => ragProviderModel.ragProviderSelected((value ?? 'openrouter') as RagProviderId)}
					allowDeselect={false}
					comboboxProps={{ withinPortal: false }}
				/>
			</Input.Wrapper>

			{activeProviderId === 'openrouter' && (
				<Input.Wrapper label={t('rag.tokens.title')}>
					<Select
						data={tokenOptions}
						value={runtime?.activeTokenId ?? null}
						onChange={(value) => ragProviderModel.ragTokenSelected(value ?? null)}
						comboboxProps={{ withinPortal: false }}
						clearable
					/>
				</Input.Wrapper>
			)}

			<Stack gap="xs">
				<Group justify="space-between">
					<Text fw={600}>{t('rag.model.manual')}</Text>
					<Button size="xs" variant="outline" onClick={() => ragProviderModel.ragModelsRefreshRequested()} disabled={!canLoadModels}>
						{t('provider.model.load')}
					</Button>
				</Group>
				<Select
					data={modelOptions}
					value={runtime?.activeModel ?? null}
					onChange={(value) => {
						setModelDraft(value ?? '');
						ragProviderModel.ragModelSelected(value ?? null);
					}}
					placeholder={canLoadModels ? t('provider.placeholders.selectModel') : t('provider.placeholders.selectTokenFirst')}
					disabled={!canLoadModels}
					clearable
					searchable
					comboboxProps={{ withinPortal: false }}
				/>
				<Group align="flex-end" wrap="nowrap">
					<TextInput
						label={t('rag.model.manual')}
						value={modelDraft}
						onChange={(event) => setModelDraft(event.currentTarget.value)}
						onBlur={applyModelDraft}
						placeholder={t('rag.model.manualPlaceholder')}
						style={{ flex: 1 }}
					/>
					<Button size="xs" variant="light" onClick={applyModelDraft}>
						{t('provider.model.applyManual')}
					</Button>
				</Group>
			</Stack>

			<Text fw={600}>{t('rag.config.title')}</Text>

			{activeProvider?.configFields.map((field) => {
				if (field.type === 'select') {
					return (
						<Select
							key={field.key}
							label={field.label}
							data={field.options ?? []}
							value={typeof configDraft[field.key] === 'string' ? (configDraft[field.key] as string) : null}
							onChange={(value) => {
								setConfigDraft((prev) => ({ ...prev, [field.key]: value ?? undefined }));
								ragProviderModel.ragConfigPatched({ providerId: activeProviderId, config: { [field.key]: value ?? undefined } });
							}}
							comboboxProps={{ withinPortal: false }}
						/>
					);
				}

				if (field.key === 'truncate') {
					return (
						<Switch
							key={field.key}
							label={field.label}
							checked={Boolean(configDraft[field.key])}
							onChange={(event) => {
								const checked = event.currentTarget.checked;
								setConfigDraft((prev) => ({ ...prev, [field.key]: checked }));
								ragProviderModel.ragConfigPatched({ providerId: activeProviderId, config: { [field.key]: checked } });
							}}
						/>
					);
				}

				const currentValue = configDraft[field.key];
				const inputValue = typeof currentValue === 'number' ? String(currentValue) : (currentValue as string | undefined) ?? '';

				return (
					<TextInput
						key={field.key}
						label={field.label}
						type={field.type === 'number' ? 'number' : 'text'}
						value={inputValue}
						placeholder={field.placeholder}
						onChange={(event) => {
							const value = event.currentTarget.value;
							setConfigDraft((prev) => ({ ...prev, [field.key]: value }));
						}}
						onBlur={(event) => {
							const rawValue = event.currentTarget.value;
							if (field.type === 'number') {
								const normalized = rawValue.trim();
								if (normalized.length === 0) {
									setConfigDraft((prev) => ({ ...prev, [field.key]: undefined }));
									ragProviderModel.ragConfigPatched({ providerId: activeProviderId, config: { [field.key]: undefined } });
									return;
								}
								const parsed = Number(normalized);
								if (!Number.isFinite(parsed) || parsed <= 0) {
									return;
								}
								setConfigDraft((prev) => ({ ...prev, [field.key]: parsed }));
								ragProviderModel.ragConfigPatched({ providerId: activeProviderId, config: { [field.key]: parsed } });
								return;
							}

							const nextValue = rawValue.trim().length > 0 ? rawValue : undefined;
							setConfigDraft((prev) => ({ ...prev, [field.key]: nextValue }));
							ragProviderModel.ragConfigPatched({ providerId: activeProviderId, config: { [field.key]: nextValue } });
						}}
					/>
				);
			})}
		</Stack>
	);
};
