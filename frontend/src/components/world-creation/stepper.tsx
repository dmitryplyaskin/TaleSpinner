import React from 'react';
import { Box, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { StepConfig } from './types';

interface WorldCreationStepperProps {
	steps: StepConfig[];
	activeStep: number;
	orientation?: 'horizontal' | 'vertical';
	alternativeLabel?: boolean;
}

export const WorldCreationStepper: React.FC<WorldCreationStepperProps> = ({
	steps,
	activeStep,
	orientation = 'horizontal',
	alternativeLabel = false,
}) => {
	return (
		<Box sx={{ width: '100%', mb: 4 }}>
			<Stepper
				activeStep={activeStep}
				orientation={orientation}
				alternativeLabel={alternativeLabel}
				sx={{
					'& .MuiStepLabel-root .Mui-completed': {
						color: 'success.main',
					},
					'& .MuiStepLabel-root .Mui-active': {
						color: 'primary.main',
					},
				}}
			>
				{steps.map((step, index) => (
					<Step key={step.id} completed={step.completed} disabled={step.disabled}>
						<StepLabel>
							<Box>
								<Typography variant="body1" fontWeight={activeStep === index ? 'bold' : 'normal'}>
									{step.label}
								</Typography>
								{step.description && (
									<Typography variant="caption" color="text.secondary">
										{step.description}
									</Typography>
								)}
							</Box>
						</StepLabel>
					</Step>
				))}
			</Stepper>
		</Box>
	);
};
