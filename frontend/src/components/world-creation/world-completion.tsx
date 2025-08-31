import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';

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

	const { t } = useTranslation();

	const handleCompleteWorldCreation = async () => {
		try {
			await completeWorldCreationFx(worldPrimer);
		} catch (error) {
			console.error('Ошибка при завершении создания мира:', error);
		}
	};

	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
			<Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
				<Box display="flex" flexDirection="column" alignItems="center" textAlign="center" gap={4}>
					<Typography variant="h3" component="h1" fontWeight="bold" color="primary">
						🎉 {t('worldCreation.completion.title')}
					</Typography>

					<Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600 }}>
						{t('worldCreation.completion.subtitle')}
					</Typography>

					<Button variant="contained" size="large" onClick={handleCompleteWorldCreation} disabled={isCompleting}>
						{isCompleting
							? t('worldCreation.completion.completingButton')
							: t('worldCreation.completion.completeButton')}
					</Button>

					<Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 400 }}>
						{t('worldCreation.completion.description')}
					</Typography>
				</Box>
			</Paper>
		</Container>
	);
};
