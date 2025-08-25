import React from 'react';
import { Box, Button } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { useWorldCreationNavigation } from './navigation';

interface StepNavigationProps {
	onNext?: () => void;
	onPrev?: () => void;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({ onNext, onPrev }) => {
	const { nextStep, prevStep, canGoNext, canGoPrev } = useWorldCreationNavigation();

	const handleNext = () => {
		if (onNext) {
			onNext();
		} else {
			nextStep();
		}
	};

	const handlePrev = () => {
		if (onPrev) {
			onPrev();
		} else {
			prevStep();
		}
	};

	return (
		<Box display="flex" justifyContent="space-between" mt={4}>
			<Box>
				<Button variant="outlined" startIcon={<ArrowBack />} onClick={handlePrev} disabled={!canGoPrev}>
					Назад
				</Button>
			</Box>

			<Box>
				<Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext} disabled={!canGoNext}>
					Далее
				</Button>
			</Box>
		</Box>
	);
};
