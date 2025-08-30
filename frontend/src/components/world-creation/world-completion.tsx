import React from 'react';
import { Box, Typography, Button, Card, CardContent, Container, Stack, Paper } from '@mui/material';
import { Public, Person, AutoStories } from '@mui/icons-material';

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
			<Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
				<Box display="flex" flexDirection="column" alignItems="center" textAlign="center" gap={4}>
					{/* Заголовок */}
					<Typography variant="h3" component="h1" fontWeight="bold" color="primary">
						🎉 {t('worldCreation.completion.title')}
					</Typography>

					{/* Описание */}
					<Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600 }}>
						{t('worldCreation.completion.subtitle')}
					</Typography>

					{/* Кнопка завершения */}
					<Button variant="contained" size="large" onClick={handleCompleteWorldCreation} disabled={isCompleting}>
						{isCompleting
							? t('worldCreation.completion.completingButton')
							: t('worldCreation.completion.completeButton')}
					</Button>

					{/* Дополнительная информация */}
					<Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 400 }}>
						{t('worldCreation.completion.description')}
					</Typography>
				</Box>
			</Paper>
		</Container>
	);
};
