import React from 'react';
import { Box, Button } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { useWorldCreationNavigation } from './navigation';

interface StepNavigationProps {
	showNext?: boolean;
	showPrev?: boolean;
	nextLabel?: string;
	prevLabel?: string;
	onNext?: () => void;
	onPrev?: () => void;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
	showNext = true,
	showPrev = true,
	nextLabel = 'Далее',
	prevLabel = 'Назад',
	onNext,
	onPrev,
}) => {
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
				{showPrev && (
					<Button variant="outlined" startIcon={<ArrowBack />} onClick={handlePrev} disabled={!canGoPrev}>
						{prevLabel}
					</Button>
				)}
			</Box>

			<Box>
				{showNext && (
					<Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext} disabled={!canGoNext}>
						{nextLabel}
					</Button>
				)}
			</Box>
		</Box>
	);
};
