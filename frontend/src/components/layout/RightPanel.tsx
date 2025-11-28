import React from 'react';
import { Box, Typography, Divider, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Info, Public, Person, History } from '@mui/icons-material';

interface RightPanelProps {
	worldName?: string;
	worldDescription?: string;
}

export const RightPanel: React.FC<RightPanelProps> = ({
	worldName = 'Текущий мир',
	worldDescription = 'Описание мира отсутствует',
}) => {
	return (
		<Box
			sx={{
				height: '100%',
				p: 3,
				display: 'flex',
				flexDirection: 'column',
				gap: 3,
			}}
		>
			{/* Заголовок панели */}
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<Info fontSize="small" color="primary" />
				<Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
					Информация о сессии
				</Typography>
			</Box>

			{/* Информация о мире */}
			<Box className="glass-card" sx={{ p: 2 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
					<Public fontSize="small" sx={{ color: 'secondary.main' }} />
					<Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
						{worldName}
					</Typography>
				</Box>
				<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
					{worldDescription}
				</Typography>
			</Box>

			<Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

			{/* Статистика или доп инфо */}
			<Box>
				<Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
					Детали
				</Typography>
				
				<List disablePadding>
					<ListItem sx={{ px: 0, py: 1 }}>
						<ListItemIcon sx={{ minWidth: 36 }}>
							<Person fontSize="small" sx={{ color: 'primary.light' }} />
						</ListItemIcon>
						<ListItemText 
							primary="Персонажи" 
							secondary="3 активных"
							primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
							secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
						/>
					</ListItem>
					<ListItem sx={{ px: 0, py: 1 }}>
						<ListItemIcon sx={{ minWidth: 36 }}>
							<History fontSize="small" sx={{ color: 'primary.light' }} />
						</ListItemIcon>
						<ListItemText 
							primary="Длительность" 
							secondary="2ч 15м"
							primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
							secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
						/>
					</ListItem>
				</List>
			</Box>

            {/* Placeholder для будущих функций */}
            <Box className="glass-card-light" sx={{ p: 2, mt: 'auto', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Здесь будут заметки и инвентарь
                </Typography>
            </Box>
		</Box>
	);
};
