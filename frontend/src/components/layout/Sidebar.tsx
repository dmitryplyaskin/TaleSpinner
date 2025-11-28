import React from 'react';
import { Box, Typography, Tooltip, Avatar, Divider } from '@mui/material';
import { Add, Settings } from '@mui/icons-material';
import { openSettings } from '../../features/settings';
import { useUnit } from 'effector-react';
import { $savedWorlds } from '@model/game-sessions';
import { goToWorldCreation } from '../../model/app-navigation';

interface SidebarProps {
	currentWorldId?: string;
	onSelectWorld?: (worldId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentWorldId, onSelectWorld }) => {
	const savedWorlds = useUnit($savedWorlds);

	const handleCreateNew = () => {
		goToWorldCreation();
	};

	const handleSettings = () => {
		openSettings();
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				p: 2,
			}}
		>
			{/* Header with Logo */}
			<Box sx={{ mb: 3 }}>
				<Typography
					variant="h5"
					sx={{
						color: 'primary.main',
						fontWeight: 600,
						textAlign: 'center',
						mb: 1,
						textShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
					}}
				>
					TaleSpinner
				</Typography>
				<Typography
					variant="caption"
					sx={{
						display: 'block',
						textAlign: 'center',
						color: 'text.secondary',
						fontStyle: 'italic',
					}}
				>
					AI Мастер Подземелий
				</Typography>
			</Box>

			{/* New World Button */}
			<Tooltip title="Создать новый мир" placement="right">
				<Box
					onClick={handleCreateNew}
					sx={{
						background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(244, 215, 117, 0.1) 100%)',
						border: '1px solid rgba(212, 175, 55, 0.3)',
						borderRadius: '12px',
						p: 1.5,
						display: 'flex',
						alignItems: 'center',
						gap: 1.5,
						cursor: 'pointer',
						transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
						'&:hover': {
							background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(244, 215, 117, 0.15) 100%)',
							borderColor: 'rgba(212, 175, 55, 0.5)',
							transform: 'translateX(4px)',
							boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)',
						},
					}}
				>
					<Box
						sx={{
							width: 40,
							height: 40,
							borderRadius: '10px',
							background: 'rgba(212, 175, 55, 0.2)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Add sx={{ color: 'primary.main' }} />
					</Box>
					<Typography
						sx={{
							color: 'text.primary',
							fontSize: '0.9rem',
							fontWeight: 500,
						}}
					>
						Новый мир
					</Typography>
				</Box>
			</Tooltip>

			<Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

			{/* Worlds List */}
			<Box sx={{ flex: 1, overflow: 'auto', pr: 0.5 }}>
				<Typography
					variant="caption"
					sx={{
						color: 'text.secondary',
						mb: 1,
						display: 'block',
						px: 1,
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
					}}
				>
					Миры
				</Typography>

				{savedWorlds.length === 0 ? (
					<Box sx={{ textAlign: 'center', py: 4 }}>
						<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
							Нет сохранённых миров
						</Typography>
					</Box>
				) : (
					savedWorlds.map((world) => (
						<Box
							key={world.id}
							className={`session-item ${currentWorldId === world.id ? 'active' : ''}`}
							onClick={() => onSelectWorld?.(world.id)}
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 1.5,
							}}
						>
							<Avatar
								sx={{
									width: 40,
									height: 40,
									background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(157, 78, 221, 0.3))',
									color: 'text.primary',
									fontSize: '1rem',
									fontWeight: 600,
								}}
							>
								{world.name?.charAt(0).toUpperCase() || 'W'}
							</Avatar>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography
									sx={{
										color: 'text.primary',
										fontSize: '0.875rem',
										fontWeight: 500,
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}
								>
									{world.name || 'Безымянный мир'}
								</Typography>
								<Typography
									variant="caption"
									sx={{
										color: 'text.secondary',
										display: 'block',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}
								>
									{world.description || 'Нет описания'}
								</Typography>
							</Box>
						</Box>
					))
				)}
			</Box>

			{/* Settings Button */}
			<Box sx={{ mt: 'auto', pt: 2 }}>
				<Tooltip title="Настройки" placement="right">
					<Box
						onClick={handleSettings}
						sx={{
							background: 'rgba(255, 255, 255, 0.03)',
							border: '1px solid rgba(255, 255, 255, 0.1)',
							borderRadius: '12px',
							p: 1.5,
							display: 'flex',
							alignItems: 'center',
							gap: 1.5,
							cursor: 'pointer',
							transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
							'&:hover': {
								background: 'rgba(255, 255, 255, 0.08)',
								borderColor: 'rgba(212, 175, 55, 0.3)',
								transform: 'translateX(4px)',
							},
						}}
					>
						<Settings sx={{ color: 'text.secondary' }} />
						<Typography
							sx={{
								color: 'text.secondary',
								fontSize: '0.9rem',
							}}
						>
							Настройки
						</Typography>
					</Box>
				</Tooltip>
			</Box>
		</Box>
	);
};
