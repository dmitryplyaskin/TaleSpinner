import React from 'react';
import { Box, Typography, Divider, Container, Paper, Button, Tab, Tabs } from '@mui/material';
import { WorldPrimer } from '@shared/types/world-creation';
import { useForm } from 'react-hook-form';
import { WorldPrimerBasicForm } from './forms/world-primer-basic-form';
import { WorldPrimerDetailedElementsForm } from './forms/world-primer-detailed-elements-form';
import { useWorldCreationNavigation } from './navigation/navigation';

export interface WorldPrimerEditProps {
	onSave?: (updatedPrimer: WorldPrimer) => void;
	onCancel?: () => void;
}

export const WorldPrimerEdit: React.FC<WorldPrimerEditProps> = ({ onSave, onCancel }) => {
	const [activeTab, setActiveTab] = React.useState(0);
	const { currentBranch, currentStepIndex } = useWorldCreationNavigation();

	const previousStep = currentBranch?.steps?.[Math.max(0, currentStepIndex - 1)];
	const worldPrimer = (previousStep?.data?.worldPrimer || null) as WorldPrimer;

	const { control, handleSubmit, reset } = useForm<WorldPrimer>({
		values: {
			...(worldPrimer || {}),
			// Убеждаемся, что все массивы инициализированы
			locations: worldPrimer?.locations || [],
			races: worldPrimer?.races || [],
			factions: worldPrimer?.factions || [],
			detailed_elements: {
				races: worldPrimer?.detailed_elements?.races || { races: [] },
				timeline: worldPrimer?.detailed_elements?.timeline || { historical_events: [] },
				locations: worldPrimer?.detailed_elements?.locations || { locations: [] },
				factions: worldPrimer?.detailed_elements?.factions || { factions: [] },
			},
		},
	});

	const handleSave = (data: WorldPrimer) => {
		const updatedPrimer: WorldPrimer = {
			...data,
			id: worldPrimer?.id || '',
			createdAt: worldPrimer?.createdAt || '',
			updatedAt: new Date().toISOString(),
		};

		if (onSave) {
			onSave(updatedPrimer);
		}
	};

	const handleReset = () => {
		reset();
	};

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	return (
		<Container maxWidth="lg">
			<Box py={3}>
				{/* Заголовок секции */}
				<Box textAlign="center" mb={4}>
					<Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
						Редактирование мира
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
						Редактируйте все аспекты вашего мира. Используйте вкладки для навигации между различными разделами.
					</Typography>
				</Box>

				{/* Навигационные вкладки */}
				<Paper elevation={1} sx={{ mb: 4, borderRadius: 2 }}>
					<Tabs
						value={activeTab}
						onChange={handleTabChange}
						variant="fullWidth"
						sx={{
							'& .MuiTabs-indicator': {
								height: 3,
							},
						}}
					>
						<Tab label="Основная информация" />
						<Tab label="Детализированные элементы" />
					</Tabs>
				</Paper>

				{/* Содержимое вкладок */}
				<Box>
					{/* Основная информация */}
					{activeTab === 0 && (
						<Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
							<Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 500 }}>
								Основная информация о мире
							</Typography>
							<WorldPrimerBasicForm control={control} />
						</Paper>
					)}

					{/* Детализированные элементы */}
					{activeTab === 1 && (
						<Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
							<Box textAlign="center" mb={4}>
								<Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
									Детализированные элементы мира
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto' }}>
									Создайте подробные описания рас, исторических событий, локаций и фракций. Эти детали помогут создать
									более живой и проработанный мир.
								</Typography>
							</Box>
							<WorldPrimerDetailedElementsForm control={control} />
						</Paper>
					)}
				</Box>

				<Divider sx={{ my: 4 }} />

				{/* Кнопки управления */}
				<Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
					<Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
						<Button variant="outlined" color="secondary" onClick={handleReset} sx={{ minWidth: 120 }}>
							Сбросить изменения
						</Button>

						{onCancel && (
							<Button variant="outlined" onClick={onCancel} sx={{ minWidth: 120 }}>
								Отменить
							</Button>
						)}

						<Button variant="contained" color="primary" onClick={handleSubmit(handleSave)} sx={{ minWidth: 120 }}>
							Сохранить изменения
						</Button>
					</Box>
				</Paper>
			</Box>
		</Container>
	);
};
