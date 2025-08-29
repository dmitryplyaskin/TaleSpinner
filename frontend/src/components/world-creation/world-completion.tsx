import React from 'react';
import { Box, Typography, Button, Card, CardContent, Container, Stack, Chip } from '@mui/material';
import { CheckCircle, Public, Person, AutoStories } from '@mui/icons-material';

import { completeWorldCreationFx } from '@model/world-creation';
import { useUnit } from 'effector-react';
import { useTranslation } from '../../hooks';
import { WorldPrimer } from '@shared/types/world-creation';
import { useWorldCreationNavigation } from './navigation';

export const WorldCompletion: React.FC = () => {
	const isCompleting = useUnit(completeWorldCreationFx.pending);
	const { currentBranch, currentStepIndex } = useWorldCreationNavigation();

	const previousStep = currentBranch?.steps?.[Math.max(0, currentStepIndex - 1)];
	const worldPrimer = (previousStep?.data?.worldPrimer || null) as WorldPrimer;
	console.log('previousStep:', previousStep);
	const { t } = useTranslation();

	const handleCompleteWorldCreation = async () => {
		try {
			console.log('worldPrimer:', worldPrimer);
			await completeWorldCreationFx(worldPrimer);
		} catch (error) {
			console.error('Ошибка при завершении создания мира:', error);
		}
	};

	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
			<Box display="flex" flexDirection="column" alignItems="center" textAlign="center" gap={4}>
				{/* Иконка успеха */}
				<Box
					sx={{
						color: 'success.main',
						mb: 2,
					}}
				>
					<CheckCircle sx={{ fontSize: 80 }} />
				</Box>

				{/* Заголовок */}
				<Typography variant="h3" component="h1" fontWeight="bold" color="primary">
					🎉 {t('worldCreation.completion.title')}
				</Typography>

				{/* Описание */}
				<Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600 }}>
					{t('worldCreation.completion.subtitle')}
				</Typography>

				{/* Карточка с информацией о созданном мире */}
				<Card
					sx={{
						width: '100%',
						maxWidth: 500,
						background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
						color: 'white',
					}}
				>
					<CardContent sx={{ p: 3 }}>
						<Typography variant="h5" gutterBottom fontWeight="bold">
							{t('worldCreation.completion.whatYouCreated')}
						</Typography>

						<Stack spacing={2} sx={{ mt: 2 }}>
							<Box display="flex" alignItems="center" gap={2}>
								<Public sx={{ color: 'white' }} />
								<Typography variant="body1">{t('worldCreation.completion.detailedWorld')}</Typography>
							</Box>

							<Box display="flex" alignItems="center" gap={2}>
								<Person sx={{ color: 'white' }} />
								<Typography variant="body1">{t('worldCreation.completion.uniqueCharacter')}</Typography>
							</Box>

							<Box display="flex" alignItems="center" gap={2}>
								<AutoStories sx={{ color: 'white' }} />
								<Typography variant="body1">{t('worldCreation.completion.adventureBase')}</Typography>
							</Box>
						</Stack>
					</CardContent>
				</Card>

				{/* Статусы */}
				<Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
					<Chip
						icon={<CheckCircle />}
						label={t('worldCreation.completion.worldCreated')}
						color="success"
						variant="filled"
					/>
					<Chip
						icon={<CheckCircle />}
						label={t('worldCreation.completion.characterReady')}
						color="success"
						variant="filled"
					/>
					<Chip
						icon={<CheckCircle />}
						label={t('worldCreation.completion.readyToPlay')}
						color="primary"
						variant="filled"
					/>
				</Stack>

				{/* Кнопка завершения */}
				<Button
					variant="contained"
					size="large"
					onClick={handleCompleteWorldCreation}
					disabled={isCompleting}
					sx={{
						px: 6,
						py: 2,
						fontSize: '1.2rem',
						fontWeight: 'bold',
						borderRadius: 3,
						background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
						boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
						'&:hover': {
							background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
						},
					}}
				>
					{isCompleting ? t('worldCreation.completion.completingButton') : t('worldCreation.completion.completeButton')}
				</Button>

				{/* Дополнительная информация */}
				<Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 400 }}>
					{t('worldCreation.completion.description')}
				</Typography>
			</Box>
		</Container>
	);
};
