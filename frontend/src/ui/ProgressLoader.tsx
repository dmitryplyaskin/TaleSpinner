import React from 'react';
import { Dialog, DialogContent, DialogActions, Typography, LinearProgress, Button, Box, Backdrop } from '@mui/material';
import { Cancel } from '@mui/icons-material';

export interface ProgressStep {
	id: string;
	description: string;
	completed: boolean;
}

interface ProgressLoaderProps {
	open: boolean;
	steps: ProgressStep[];
	currentStep: number;
	onCancel: () => void;
	title?: string;
}

export const ProgressLoader: React.FC<ProgressLoaderProps> = ({
	open,
	steps,
	currentStep,
	onCancel,
	title = 'Загрузка...',
}) => {
	const progress = steps.length > 0 ? (currentStep / steps.length) * 100 : 0;
	const currentStepData = steps[currentStep];

	return (
		<Dialog
			open={open}
			maxWidth="sm"
			fullWidth
			disableEscapeKeyDown
			sx={{
				'& .MuiDialog-paper': {
					borderRadius: 2,
					px: 2,
					py: 1,
				},
			}}
			BackdropComponent={(props) => (
				<Backdrop
					{...props}
					sx={{
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						backdropFilter: 'blur(2px)',
					}}
				/>
			)}
		>
			<DialogContent sx={{ pb: 2 }}>
				<Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 3 }}>
					{title}
				</Typography>

				<Box sx={{ mb: 3 }}>
					<Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
						<Typography variant="body2" color="text.secondary">
							Шаг {currentStep + 1} из {steps.length}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{Math.round(progress)}%
						</Typography>
					</Box>
					<LinearProgress
						variant="determinate"
						value={progress}
						sx={{
							height: 8,
							borderRadius: 4,
							'& .MuiLinearProgress-bar': {
								borderRadius: 4,
							},
						}}
					/>
				</Box>

				{currentStepData && (
					<Box sx={{ textAlign: 'center', mb: 2 }}>
						<Typography variant="body1" color="text.primary" sx={{ fontWeight: 500 }}>
							{currentStepData.description}
						</Typography>
					</Box>
				)}

				<Box sx={{ mt: 3 }}>
					<Typography variant="body2" color="text.secondary" gutterBottom>
						Выполненные шаги:
					</Typography>
					<Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
						{steps.map((step, index) => (
							<Typography
								key={step.id}
								variant="body2"
								sx={{
									color:
										index < currentStep ? 'text.secondary' : index === currentStep ? 'primary.main' : 'text.disabled',
									fontWeight: index === currentStep ? 500 : 400,
									py: 0.5,
								}}
							>
								{index < currentStep ? '✓' : index === currentStep ? '⏳' : '⏸'} {step.description}
							</Typography>
						))}
					</Box>
				</Box>
			</DialogContent>

			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onCancel} variant="outlined" color="error" startIcon={<Cancel />} fullWidth size="large">
					Отменить
				</Button>
			</DialogActions>
		</Dialog>
	);
};
