import { Button, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Dialog } from '@ui/dialog';
import { toaster } from '@ui/toaster';

import { LlmTokenManagerDialog } from '../../../../../../../llm-provider/llm-token-manager-dialog';
import { LlmRuntimeSelectorFields } from '../../../../../../../llm-provider/runtime-selector-fields';

import { OperationLlmPresetManager } from './operation-llm-preset-manager';

import type { LlmPresetDto } from '../../../../../../../../api/llm';
import type { OperationLlmRuntimeFields } from '../../../../../form/operation-llm-form-utils';
import type { LlmModel, LlmProviderDefinition, LlmProviderId, LlmTokenListItem } from '@shared/types/llm';

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	providers: LlmProviderDefinition[];
	tokens: LlmTokenListItem[];
	models: LlmModel[];
	presets: LlmPresetDto[];
	runtime: OperationLlmRuntimeFields;
	onRuntimeChange: (patch: Partial<OperationLlmRuntimeFields>) => void;
	onPresetSelect: (presetId: string | null) => void;
	onLoadModels: () => Promise<void>;
	onCreatePreset: (params: { name: string; payload: LlmPresetDto['payload'] }) => Promise<LlmPresetDto>;
	onUpdatePreset: (params: {
		presetId: string;
		name?: string;
		description?: string | null;
		payload?: LlmPresetDto['payload'];
	}) => Promise<LlmPresetDto>;
	onDeletePreset: (presetId: string) => Promise<{ id: string }>;
};

export const OperationLlmRuntimeDialog: React.FC<Props> = ({
	open,
	onOpenChange,
	providers,
	tokens,
	models,
	presets,
	runtime,
	onRuntimeChange,
	onPresetSelect,
	onLoadModels,
	onCreatePreset,
	onUpdatePreset,
	onDeletePreset,
}) => {
	const { t } = useTranslation();
	const [isTokenManagerOpen, setTokenManagerOpen] = useState(false);

	return (
		<>
			<Dialog
				open={open}
				onOpenChange={onOpenChange}
				title={t('operationProfiles.llmRuntime.dialogTitle')}
				size="xl"
				footer={
					<Button variant="subtle" onClick={() => onOpenChange(false)}>
						{t('common.close')}
					</Button>
				}
			>
				<Stack gap="md">
					<Text size="sm" c="dimmed">
						{t('operationProfiles.llmRuntime.dialogDescription')}
					</Text>

					<OperationLlmPresetManager
						presets={presets}
						selectedPresetId={runtime.llmPresetId}
						runtime={runtime}
						onPresetSelect={onPresetSelect}
						onCreatePreset={onCreatePreset}
						onUpdatePreset={onUpdatePreset}
						onDeletePreset={onDeletePreset}
					/>

					<LlmRuntimeSelectorFields
						providers={providers}
						activeProviderId={runtime.providerId}
						tokens={tokens}
						activeTokenId={runtime.credentialRef || null}
						models={models}
						activeModel={runtime.model || null}
						onProviderSelect={(providerId: LlmProviderId) =>
							onRuntimeChange({
								providerId,
								credentialRef: '',
								model: '',
							})
						}
						onTokenSelect={(tokenId: string | null) =>
							onRuntimeChange({
								credentialRef: tokenId ?? '',
								model: '',
							})
						}
						onModelSelect={(model: string | null) => onRuntimeChange({ model: model ?? '' })}
						onLoadModels={async () => {
							try {
								await onLoadModels();
							} catch (error) {
								toaster.error({
									title: t('provider.toasts.modelsLoadFailed'),
									description: error instanceof Error ? error.message : String(error),
								});
							}
						}}
						allowTokenManager
						showInlineTokenManager={false}
						tokenManagerScope="global"
						tokenManagerScopeId="global"
						onOpenTokenManager={setTokenManagerOpen}
					/>
					<Text size="sm" c="dimmed">
						{t('operationProfiles.llmRuntime.tokenHelp')}
					</Text>
				</Stack>
			</Dialog>

			<LlmTokenManagerDialog
				open={isTokenManagerOpen}
				onOpenChange={setTokenManagerOpen}
				providerId={runtime.providerId}
				activeTokenId={runtime.credentialRef || null}
				onTokenSelected={(tokenId: string | null) => onRuntimeChange({ credentialRef: tokenId ?? '', model: '' })}
			/>
		</>
	);
};
