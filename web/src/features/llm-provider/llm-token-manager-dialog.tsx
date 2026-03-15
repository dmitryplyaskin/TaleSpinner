import { Button, Divider, Flex, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { llmProviderModel } from '@model/provider';
import { Dialog } from '@ui/dialog';

import type { LlmProviderId } from '@shared/types/llm';

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	providerId: LlmProviderId;
	activeTokenId?: string | null;
	onTokenSelected?: (tokenId: string | null) => void;
};

export const LlmTokenManagerDialog: React.FC<Props> = ({
	open,
	onOpenChange,
	providerId,
	activeTokenId = null,
	onTokenSelected,
}) => {
	const { t } = useTranslation();
	const [tokensByProviderId, createTokenFx, patchTokenFx, deleteTokenFx, loadTokensFx] = useUnit([
		llmProviderModel.$tokensByProviderId,
		llmProviderModel.createTokenFx,
		llmProviderModel.patchTokenFx,
		llmProviderModel.deleteTokenFx,
		llmProviderModel.loadTokensFx,
	]);

	const tokens = useMemo(() => tokensByProviderId[providerId] ?? [], [providerId, tokensByProviderId]);
	const [newName, setNewName] = useState('');
	const [newToken, setNewToken] = useState('');
	const [editingId, setEditingId] = useState<string | null>(null);
	const editing = useMemo(() => tokens.find((item) => item.id === editingId) ?? null, [editingId, tokens]);
	const [editName, setEditName] = useState('');
	const [editToken, setEditToken] = useState('');

	const resetDrafts = () => {
		setEditingId(null);
		setNewName('');
		setNewToken('');
		setEditName('');
		setEditToken('');
	};

	const handleOpenChange = (nextOpen: boolean) => {
		onOpenChange(nextOpen);
		if (nextOpen) return;
		resetDrafts();
	};

	const startEdit = (tokenId: string) => {
		const token = tokens.find((item) => item.id === tokenId);
		if (!token) return;
		setEditingId(tokenId);
		setEditName(token.name);
		setEditToken('');
	};

	const submitCreate = async () => {
		const name = newName.trim();
		const token = newToken.trim();
		if (!name || !token) return;

		const created = await createTokenFx({ providerId, name, token });
		await loadTokensFx(providerId);
		onTokenSelected?.(created.id);
		setNewName('');
		setNewToken('');
	};

	const submitEdit = async () => {
		if (!editingId) return;
		await patchTokenFx({
			id: editingId,
			name: editName.trim() || undefined,
			token: editToken.trim() || undefined,
		});
		await loadTokensFx(providerId);
		setEditingId(null);
		setEditToken('');
	};

	const submitDelete = async (tokenId: string) => {
		await deleteTokenFx(tokenId);
		await loadTokensFx(providerId);
		if (tokenId === activeTokenId) {
			onTokenSelected?.(null);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={handleOpenChange}
			title={t('tokenManager.title')}
			size="lg"
			footer={
				<Flex justify="flex-end" gap={2}>
					<Button variant="subtle" onClick={() => handleOpenChange(false)}>
						{t('common.close')}
					</Button>
				</Flex>
			}
			showCloseButton
			closeOnEscape
			closeOnInteractOutside
		>
			<Stack gap="sm">
				<Text fw={600}>{t('tokenManager.addToken')}</Text>
				<Stack gap="xs">
					<TextInput placeholder={t('tokenManager.fields.name')} value={newName} onChange={(event) => setNewName(event.currentTarget.value)} />
					<PasswordInput
						placeholder={t('tokenManager.fields.token')}
						value={newToken}
						onChange={(event) => setNewToken(event.currentTarget.value)}
					/>
					<Flex justify="flex-end">
						<Button onClick={submitCreate} disabled={!newName.trim() || !newToken.trim()}>
							{t('common.add')}
						</Button>
					</Flex>
				</Stack>

				<Divider />

				<Text fw={600}>{t('tokenManager.tokensFor', { providerId })}</Text>

				{tokens.length === 0 ? (
					<Text c="dimmed">{t('tokenManager.empty')}</Text>
				) : (
					<Stack gap="xs">
						{tokens.map((token) => (
							<Flex key={token.id} gap={2} align="center" justify="space-between">
								<Stack gap={0} style={{ minWidth: 0 }}>
									<Text fw={500}>
										{token.name} {token.id === activeTokenId ? t('tokenManager.activeSuffix') : ''}
									</Text>
									<Text size="sm" c="dimmed">
										{token.tokenHint}
									</Text>
								</Stack>
								<Flex gap={2}>
									<Button size="sm" variant="outline" onClick={() => startEdit(token.id)}>
										{t('common.edit')}
									</Button>
									<Button size="sm" variant="outline" color="red" onClick={() => void submitDelete(token.id)}>
										{t('common.delete')}
									</Button>
								</Flex>
							</Flex>
						))}
					</Stack>
				)}

				{editing ? (
					<Stack gap="xs" mt="md" p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}>
						<Text fw={600}>{t('tokenManager.editToken')}</Text>
						<TextInput value={editName} onChange={(event) => setEditName(event.currentTarget.value)} placeholder={t('tokenManager.fields.name')} />
						<PasswordInput
							value={editToken}
							onChange={(event) => setEditToken(event.currentTarget.value)}
							placeholder={t('tokenManager.fields.newTokenPlaceholder', { hint: editing.tokenHint })}
						/>
						<Flex justify="flex-end" gap={2}>
							<Button variant="subtle" onClick={() => setEditingId(null)}>
								{t('common.cancel')}
							</Button>
							<Button onClick={submitEdit} disabled={!editName.trim() && !editToken.trim()}>
								{t('common.save')}
							</Button>
						</Flex>
					</Stack>
				) : null}
			</Stack>
		</Dialog>
	);
};
