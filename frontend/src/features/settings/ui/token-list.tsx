/**
 * Компонент управления API токенами
 */

import React, { useState } from 'react';
import {
	Box,
	Typography,
	TextField,
	Button,
	IconButton,
	List,
	ListItem,
	ListItemText,
	Radio,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	CircularProgress,
	Alert,
} from '@mui/material';
import { Delete, Edit, Add, Check, Close } from '@mui/icons-material';
import { useUnit } from 'effector-react';
import {
	$settings,
	$tokenOperationPending,
	addTokenFx,
	updateTokenFx,
	deleteTokenFx,
	activateTokenFx,
} from '../model';
import type { ApiToken } from '../model';

export const TokenList: React.FC = () => {
	const settings = useUnit($settings);
	const isPending = useUnit($tokenOperationPending);

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [newTokenName, setNewTokenName] = useState('');
	const [newTokenValue, setNewTokenValue] = useState('');

	const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
	const [editingTokenName, setEditingTokenName] = useState('');

	const tokens = settings.api.tokens;
	const activeTokenId = settings.api.activeTokenId;

	const handleAddToken = async () => {
		if (!newTokenValue.trim()) return;

		await addTokenFx({
			name: newTokenName.trim() || `Токен ${tokens.length + 1}`,
			value: newTokenValue.trim(),
		});

		setNewTokenName('');
		setNewTokenValue('');
		setIsAddDialogOpen(false);
	};

	const handleStartEdit = (token: ApiToken) => {
		setEditingTokenId(token.id);
		setEditingTokenName(token.name);
	};

	const handleSaveEdit = async () => {
		if (!editingTokenId || !editingTokenName.trim()) return;

		await updateTokenFx({
			tokenId: editingTokenId,
			request: { name: editingTokenName.trim() },
		});

		setEditingTokenId(null);
		setEditingTokenName('');
	};

	const handleCancelEdit = () => {
		setEditingTokenId(null);
		setEditingTokenName('');
	};

	const handleDeleteToken = async (tokenId: string) => {
		await deleteTokenFx(tokenId);
	};

	const handleActivateToken = async (tokenId: string) => {
		if (tokenId === activeTokenId) return;
		await activateTokenFx(tokenId);
	};

	return (
		<Box>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
				<Typography variant="subtitle2" color="text.secondary">
					API Токены
				</Typography>
				<Button
					variant="text"
					size="small"
					startIcon={<Add sx={{ fontSize: 16 }} />}
					onClick={() => setIsAddDialogOpen(true)}
					disabled={isPending}
					sx={{ fontSize: '0.75rem', py: 0.25 }}
				>
					Добавить
				</Button>
			</Box>

			{tokens.length === 0 ? (
				<Alert severity="info" sx={{ py: 0.5, fontSize: '0.8rem' }}>
					Добавьте токен OpenRouter
				</Alert>
			) : (
				<List disablePadding sx={{ '& .MuiListItem-root': { py: 0.75 } }}>
					{tokens.map((token) => (
						<ListItem
							key={token.id}
							sx={{
								border: 1,
								borderColor: token.isActive ? 'primary.main' : 'divider',
								borderRadius: 1,
								mb: 0.75,
								bgcolor: token.isActive ? 'action.selected' : 'transparent',
								px: 1,
							}}
						>
							<Radio
								checked={token.isActive}
								onChange={() => handleActivateToken(token.id)}
								disabled={isPending}
								size="small"
								sx={{ mr: 0.5, p: 0.5 }}
							/>

							{editingTokenId === token.id ? (
								<Box display="flex" alignItems="center" flex={1} gap={0.5}>
									<TextField
										value={editingTokenName}
										onChange={(e) => setEditingTokenName(e.target.value)}
										size="small"
										fullWidth
										autoFocus
										disabled={isPending}
										sx={{ '& .MuiInputBase-input': { py: 0.5, fontSize: '0.85rem' } }}
									/>
									<IconButton
										onClick={handleSaveEdit}
										disabled={isPending || !editingTokenName.trim()}
										color="primary"
										size="small"
									>
										<Check sx={{ fontSize: 18 }} />
									</IconButton>
									<IconButton onClick={handleCancelEdit} disabled={isPending} size="small">
										<Close sx={{ fontSize: 18 }} />
									</IconButton>
								</Box>
							) : (
								<>
									<ListItemText
										primary={token.name}
										secondary={token.isActive ? 'Активный' : undefined}
										primaryTypographyProps={{ fontSize: '0.85rem' }}
										secondaryTypographyProps={{ fontSize: '0.7rem' }}
									/>
									<IconButton
										onClick={() => handleStartEdit(token)}
										disabled={isPending}
										size="small"
									>
										<Edit sx={{ fontSize: 16 }} />
									</IconButton>
									<IconButton
										onClick={() => handleDeleteToken(token.id)}
										disabled={isPending}
										color="error"
										size="small"
									>
										<Delete sx={{ fontSize: 16 }} />
									</IconButton>
								</>
							)}
						</ListItem>
					))}
				</List>
			)}

			{/* Диалог добавления токена */}
			<Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="xs" fullWidth>
				<DialogTitle sx={{ pb: 1 }}>Добавить токен</DialogTitle>
				<DialogContent>
					<Box display="flex" flexDirection="column" gap={2} pt={1}>
						<TextField
							label="Название"
							value={newTokenName}
							onChange={(e) => setNewTokenName(e.target.value)}
							placeholder={`Токен ${tokens.length + 1}`}
							fullWidth
							size="small"
							disabled={isPending}
						/>
						<TextField
							label="API ключ"
							value={newTokenValue}
							onChange={(e) => setNewTokenValue(e.target.value)}
							type="password"
							fullWidth
							size="small"
							required
							placeholder="sk-or-v1-..."
							disabled={isPending}
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setIsAddDialogOpen(false)} disabled={isPending} size="small">
						Отмена
					</Button>
					<Button
						onClick={handleAddToken}
						variant="contained"
						size="small"
						disabled={isPending || !newTokenValue.trim()}
						startIcon={isPending ? <CircularProgress size={14} /> : undefined}
					>
						Добавить
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};







