import { Alert, Button, Group, Select, Stack, Switch, Text, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import type { LlmProviderConfig, LlmProviderConnectionCheckResult, LlmProviderId } from '@shared/types/llm';

type Props = {
	activeProviderId: LlmProviderId;
	configDraft: LlmProviderConfig;
	onChange: (next: LlmProviderConfig) => void;
	onSave: () => Promise<void>;
	onCheckConnection: () => Promise<void>;
	isCheckingConnection: boolean;
	connectionCheckResult: LlmProviderConnectionCheckResult | null;
};

const TTL_OPTIONS = [
	{ value: '5m', label: '5m' },
	{ value: '1h', label: '1h' },
];

export const LlmProviderAdvancedConfig: React.FC<Props> = ({
	activeProviderId,
	configDraft,
	onChange,
	onSave,
	onCheckConnection,
	isCheckingConnection,
	connectionCheckResult,
}) => {
	const { t } = useTranslation();

	const tokenPolicy = configDraft.tokenPolicy ?? {};
	const anthropicCache = configDraft.anthropicCache ?? {};
	const messageNormalization = configDraft.messageNormalization ?? {};

	const updateTokenPolicy = (patch: Partial<NonNullable<LlmProviderConfig['tokenPolicy']>>) => {
		onChange({
			...configDraft,
			tokenPolicy: {
				...tokenPolicy,
				...patch,
			},
		});
	};

	const updateAnthropicCache = (patch: Partial<NonNullable<LlmProviderConfig['anthropicCache']>>) => {
		onChange({
			...configDraft,
			anthropicCache: {
				...anthropicCache,
				...patch,
			},
		});
	};

	const updateMessageNormalization = (patch: Partial<NonNullable<LlmProviderConfig['messageNormalization']>>) => {
		onChange({
			...configDraft,
			messageNormalization: {
				...messageNormalization,
				...patch,
			},
		});
	};

	return (
		<Stack gap="sm">
			<Text fw={600}>{t('provider.config.title')}</Text>

			{activeProviderId === 'openai_compatible' && (
				<TextInput
					label={t('provider.config.baseUrl')}
					value={String(configDraft.baseUrl ?? '')}
					onChange={(event) => onChange({ ...configDraft, baseUrl: event.currentTarget.value })}
					placeholder="http://localhost:1234/v1"
				/>
			)}

			<TextInput
				label={t('provider.config.defaultModel')}
				value={String(configDraft.defaultModel ?? '')}
				onChange={(event) => onChange({ ...configDraft, defaultModel: event.currentTarget.value })}
				placeholder="gpt-4o-mini"
			/>

			<Stack gap={6}>
				<Text size="sm" fw={600}>
					{t('provider.config.tokenPolicy.title')}
				</Text>
				<Switch
					checked={tokenPolicy.randomize === true}
					onChange={(event) => updateTokenPolicy({ randomize: event.currentTarget.checked })}
					label={t('provider.config.tokenPolicy.randomize')}
				/>
				<Switch
					checked={tokenPolicy.fallbackOnError === true}
					onChange={(event) => updateTokenPolicy({ fallbackOnError: event.currentTarget.checked })}
					label={t('provider.config.tokenPolicy.fallbackOnError')}
				/>
			</Stack>

			<Stack gap={6}>
				<Text size="sm" fw={600}>
					{t('provider.config.messageNormalization.title')}
				</Text>
				<Switch
					checked={messageNormalization.enabled !== false}
					onChange={(event) => updateMessageNormalization({ enabled: event.currentTarget.checked })}
					label={t('provider.config.messageNormalization.enabled')}
				/>
				<Text size="xs" c="dimmed">
					{t('provider.config.messageNormalization.helpText')}
				</Text>
			</Stack>

			<Stack gap={6}>
				<Text size="sm" fw={600}>
					{t('provider.config.anthropicCache.title')}
				</Text>
				<Switch
					checked={anthropicCache.enabled === true}
					onChange={(event) => updateAnthropicCache({ enabled: event.currentTarget.checked })}
					label={t('provider.config.anthropicCache.enabled')}
				/>

				{anthropicCache.enabled === true && (
					<>
						<TextInput
							label={t('provider.config.anthropicCache.depth')}
							value={String(anthropicCache.depth ?? 0)}
							onChange={(event) => {
								const value = Number.parseInt(event.currentTarget.value, 10);
								updateAnthropicCache({ depth: Number.isFinite(value) && value >= 0 ? value : 0 });
							}}
						/>
						<Select
							label={t('provider.config.anthropicCache.ttl')}
							data={TTL_OPTIONS}
							value={anthropicCache.ttl ?? '5m'}
							onChange={(value) =>
								updateAnthropicCache({
									ttl: value === '1h' ? '1h' : '5m',
								})
							}
							allowDeselect={false}
							comboboxProps={{ withinPortal: false }}
						/>
						<Text size="xs" c="dimmed">
							{t('provider.config.anthropicCache.helpText')}
						</Text>
					</>
				)}
			</Stack>

			<Group justify="flex-end">
				<Button size="xs" variant="light" onClick={() => void onCheckConnection()} loading={isCheckingConnection}>
					{t('provider.config.checkConnection')}
				</Button>
				<Button size="xs" variant="outline" onClick={() => void onSave()}>
					{t('provider.config.save')}
				</Button>
			</Group>

			<Text size="xs" c="dimmed">
				{t('provider.config.checkConnectionHelp')}
			</Text>

			{connectionCheckResult ? (
				<Alert
					color={connectionCheckResult.ok ? 'green' : 'red'}
					variant="light"
					title={t(
						connectionCheckResult.ok
							? 'provider.config.connectionSuccessTitle'
							: 'provider.config.connectionErrorTitle',
					)}
				>
					<Stack gap={4}>
						<Text size="sm">{connectionCheckResult.message}</Text>
						{connectionCheckResult.checkedUrl ? (
							<Text size="xs" c="dimmed">
								{t('provider.config.checkedEndpoint')}: {connectionCheckResult.checkedUrl}
							</Text>
						) : null}
						{connectionCheckResult.hints.map((hint, index) => (
							<Text key={`${connectionCheckResult.issueCode ?? 'ok'}:${index}`} size="xs" c="dimmed">
								• {hint}
							</Text>
						))}
					</Stack>
				</Alert>
			) : null}
		</Stack>
	);
};
