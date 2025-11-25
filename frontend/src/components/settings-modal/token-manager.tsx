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
	ListItemSecondaryAction,
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
} from '../../model/settings';
import { ApiToken } from '../../../../shared/types/settings';

export const TokenManager: React.FC = () => {
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
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
				<Typography variant="h6" component="h3">
					API Токены
				</Typography>
				<Button
					variant="outlined"
					startIcon={<Add />}
					onClick={() => setIsAddDialogOpen(true)}
					disabled={isPending}
					size="small"
				>
					Добавить токен
				</Button>
			</Box>

			{tokens.length === 0 ? (
				<Alert severity="info">
					Нет добавленных токенов. Добавьте токен OpenRouter для работы с моделями.
				</Alert>
			) : (
				<List>
					{tokens.map((token) => (
						<ListItem
							key={token.id}
							sx={{
								border: 1,
								borderColor: token.isActive ? 'primary.main' : 'divider',
								borderRadius: 1,
								mb: 1,
								bgcolor: token.isActive ? 'action.selected' : 'transparent',
							}}
						>
							<Radio
								checked={token.isActive}
								onChange={() => handleActivateToken(token.id)}
								disabled={isPending}
								sx={{ mr: 1 }}
							/>

							{editingTokenId === token.id ? (
								<Box display="flex" alignItems="center" flex={1} gap={1}>
									<TextField
										value={editingTokenName}
										onChange={(e) => setEditingTokenName(e.target.value)}
										size="small"
										fullWidth
										autoFocus
										disabled={isPending}
									/>
									<IconButton
										onClick={handleSaveEdit}
										disabled={isPending || !editingTokenName.trim()}
										color="primary"
										size="small"
									>
										<Check />
									</IconButton>
									<IconButton onClick={handleCancelEdit} disabled={isPending} size="small">
										<Close />
									</IconButton>
								</Box>
							) : (
								<>
									<ListItemText
										primary={token.name}
										secondary={token.isActive ? 'Активный' : undefined}
									/>
									<ListItemSecondaryAction>
										<IconButton
											onClick={() => handleStartEdit(token)}
											disabled={isPending}
											size="small"
										>
											<Edit />
										</IconButton>
										<IconButton
											onClick={() => handleDeleteToken(token.id)}
											disabled={isPending}
											color="error"
											size="small"
										>
											<Delete />
										</IconButton>
									</ListItemSecondaryAction>
								</>
							)}
						</ListItem>
					))}
				</List>
			)}

			{/* Диалог добавления нового токена */}
			<Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Добавить новый токен</DialogTitle>
				<DialogContent>
					<Box display="flex" flexDirection="column" gap={2} pt={1}>
						<TextField
							label="Название токена"
							value={newTokenName}
							onChange={(e) => setNewTokenName(e.target.value)}
							placeholder={`Токен ${tokens.length + 1}`}
							fullWidth
							disabled={isPending}
						/>
						<TextField
							label="API Токен"
							value={newTokenValue}
							onChange={(e) => setNewTokenValue(e.target.value)}
							type="password"
							fullWidth
							required
							placeholder="sk-or-v1-..."
							disabled={isPending}
							helperText="Токен будет сохранен на сервере и не будет отображаться"
						/>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsAddDialogOpen(false)} disabled={isPending}>
						Отмена
					</Button>
					<Button
						onClick={handleAddToken}
						variant="contained"
						disabled={isPending || !newTokenValue.trim()}
						startIcon={isPending ? <CircularProgress size={16} /> : undefined}
					>
						Добавить
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

