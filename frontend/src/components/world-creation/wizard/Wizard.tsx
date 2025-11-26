import React from 'react';
import { useUnit } from 'effector-react';
import {
	Box,
	Stepper,
	Step,
	StepLabel,
	Paper,
	Alert,
	Typography,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Button,
	Container,
} from '@mui/material';
import { ArrowBack, Warning } from '@mui/icons-material';
import { GenreSelection } from '../../../features/world-creation';
import { WorldInput } from './steps/WorldInput';
import { QuestionForm } from './steps/QuestionForm';
import { GenerationProgress } from './steps/GenerationProgress';
import { WorldReview } from './steps/WorldReview';
import { goToWelcome } from '../../../model/app-navigation';
import {
	$step,
	$sessionId,
	$error,
	$exitDialogOpen,
	openExitDialog,
	closeExitDialog,
	resetWizard,
	clearError,
} from '../../../model/agent-wizard';

const steps = ['Выбор жанра', 'Описание мира', 'Уточнение деталей', 'Проверка и сохранение'];

// Маппинг шагов wizard на индексы stepper
const stepToIndex: Record<string, number> = {
	setting: 0,
	input: 1,
	questions: 2,
	generating: 2,
	review: 3,
};

export const Wizard = () => {
	const { step, sessionId, error, exitDialogOpen } = useUnit({
		step: $step,
		sessionId: $sessionId,
		error: $error,
		exitDialogOpen: $exitDialogOpen,
	});

	const handleOpenExitDialog = useUnit(openExitDialog);
	const handleCloseExitDialog = useUnit(closeExitDialog);
	const handleResetWizard = useUnit(resetWizard);
	const handleClearError = useUnit(clearError);

	const handleExitClick = () => {
		// Если пользователь ещё не начал вводить данные, выходим сразу
		if (step === 'setting' && !sessionId) {
			goToWelcome();
			return;
		}
		handleOpenExitDialog();
	};

	const handleExitConfirm = () => {
		handleCloseExitDialog();
		handleResetWizard();
		goToWelcome();
	};

	const activeStepIndex = stepToIndex[step] ?? 0;

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			{/* Header */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 2,
					mb: 4,
				}}
			>
				<IconButton
					onClick={handleExitClick}
					size="large"
					sx={{
						border: '1px solid',
						borderColor: 'divider',
						'&:hover': {
							borderColor: 'warning.main',
							bgcolor: 'rgba(255, 143, 0, 0.08)',
						},
					}}
				>
					<ArrowBack />
				</IconButton>
				<Box>
					<Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
						Создание мира
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Пошаговый мастер создания игрового мира
					</Typography>
				</Box>
			</Box>

			{/* Stepper */}
			<Stepper
				activeStep={activeStepIndex}
				sx={{
					mb: 4,
					'& .MuiStepLabel-label': {
						fontSize: '0.9rem',
					},
					'& .MuiStepIcon-root.Mui-active': {
						color: 'primary.main',
					},
					'& .MuiStepIcon-root.Mui-completed': {
						color: 'success.main',
					},
				}}
			>
				{steps.map((label) => (
					<Step key={label}>
						<StepLabel
							sx={{
								'& .MuiStepLabel-label.Mui-active': {
									color: 'primary.main',
									fontWeight: 600,
								},
							}}
						>
							{label}
						</StepLabel>
					</Step>
				))}
			</Stepper>

			{/* Error Alert */}
			{error && (
				<Alert severity="error" sx={{ mb: 3 }} onClose={handleClearError}>
					{error}
				</Alert>
			)}

			{/* Content */}
			<Paper
				sx={{
					p: 4,
					minHeight: '60vh',
					position: 'relative',
					overflow: 'hidden',
					'&::before': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: '4px',
						background: 'linear-gradient(90deg, #d4af37 0%, #8b4789 50%, #4a90a4 100%)',
					},
				}}
			>
				{step === 'setting' && <GenreSelection />}
				{step === 'input' && <WorldInput />}
				{step === 'questions' && <QuestionForm />}
				{step === 'generating' && <GenerationProgress />}
				{step === 'review' && <WorldReview />}
			</Paper>

			{/* Exit Confirmation Dialog */}
			<Dialog
				open={exitDialogOpen}
				onClose={handleCloseExitDialog}
				PaperProps={{
					sx: {
						borderTop: '4px solid',
						borderColor: 'warning.main',
					},
				}}
			>
				<DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Warning color="warning" />
					Выйти из создания мира?
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Весь прогресс создания мира будет потерян. Вы уверены, что хотите выйти?
					</DialogContentText>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={handleCloseExitDialog} variant="outlined">
						Остаться
					</Button>
					<Button
						onClick={handleExitConfirm}
						variant="contained"
						color="warning"
						sx={{
							bgcolor: 'warning.main',
							color: 'warning.contrastText',
							'&:hover': {
								bgcolor: 'warning.dark',
							},
						}}
					>
						Выйти
					</Button>
				</DialogActions>
			</Dialog>
		</Container>
	);
};
