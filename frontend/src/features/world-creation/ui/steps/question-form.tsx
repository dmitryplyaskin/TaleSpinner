import React, { useState, useEffect } from 'react';
import { useUnit } from 'effector-react';
import {
	Box,
	Typography,
	TextField,
	Button,
	CircularProgress,
	Paper,
	Alert,
	Radio,
	RadioGroup,
	FormControlLabel,
	FormControl,
	FormLabel,
	Checkbox,
	FormGroup,
	Divider,
	alpha,
	useTheme,
} from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
import { $clarificationRequest, $sessionId, $isContinuing, continueGenerationFx } from '../../model';
import type { ClarificationField, ClarificationOption } from '@shared/types/human-in-the-loop';

// Styled Components for Option Cards
const OptionCard = ({
	selected,
	onClick,
	children,
}: {
	selected: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) => {
	const theme = useTheme();

	return (
		<Paper
			elevation={0}
			onClick={onClick}
			sx={{
				p: 2,
				mb: 1.5,
				cursor: 'pointer',
				border: '1px solid',
				borderColor: selected ? 'primary.main' : 'divider',
				bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
				transition: 'all 0.2s ease-in-out',
				'&:hover': {
					borderColor: selected ? 'primary.main' : 'text.secondary',
					bgcolor: selected ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.text.primary, 0.04),
					transform: 'translateY(-2px)',
				},
				display: 'flex',
				alignItems: 'flex-start',
				gap: 2,
			}}
		>
			{children}
		</Paper>
	);
};

export const QuestionForm: React.FC = () => {
	const request = useUnit($clarificationRequest);
	const sessionId = useUnit($sessionId);
	const isSubmitting = useUnit($isContinuing);
	const handleContinue = useUnit(continueGenerationFx);

	const [answers, setAnswers] = useState<Record<string, any>>({});

	// Initialize default values
	useEffect(() => {
		if (request) {
			const initialAnswers: Record<string, any> = {};
			request.fields.forEach((field) => {
				if (field.defaultValue !== undefined) {
					initialAnswers[field.id] = field.defaultValue;
				} else if (field.type === 'multiselect') {
					initialAnswers[field.id] = [];
				}
			});
			setAnswers(initialAnswers);
		}
	}, [request]);

	if (!request) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 400 }}>
				<CircularProgress />
				<Typography sx={{ ml: 2 }}>Waiting for agent...</Typography>
			</Box>
		);
	}

	const handleFieldChange = (fieldId: string, value: any) => {
		setAnswers((prev) => ({
			...prev,
			[fieldId]: value,
		}));
	};

	const handleMultiSelectChange = (fieldId: string, value: string, checked: boolean) => {
		setAnswers((prev) => {
			const current = (prev[fieldId] as string[]) || [];
			if (checked) {
				return { ...prev, [fieldId]: [...current, value] };
			} else {
				return { ...prev, [fieldId]: current.filter((v) => v !== value) };
			}
		});
	};

	const handleSubmit = () => {
		if (sessionId && request) {
			handleContinue({
				sessionId,
				response: {
					requestId: request.id,
					skipped: false,
					answers,
				},
			});
		}
	};

	const handleSkip = () => {
		if (sessionId && request) {
			handleContinue({
				sessionId,
				response: {
					requestId: request.id,
					skipped: true,
					answers: {},
				},
			});
		}
	};

	const renderField = (field: ClarificationField) => {
		switch (field.type) {
			case 'radio':
				return (
					<FormControl component="fieldset" fullWidth>
						<Typography variant="h6" gutterBottom color="text.primary" sx={{ mb: 2 }}>
							{field.label}
						</Typography>
						<RadioGroup
							value={answers[field.id] || ''}
							onChange={(e) => handleFieldChange(field.id, e.target.value)}
							sx={{ display: 'none' }} // Hide default radio group, we manage state manually via cards
						/>
						<Box>
							{field.options?.map((opt: ClarificationOption) => {
								const isSelected = answers[field.id] === opt.value;
								return (
									<OptionCard
										key={opt.value}
										selected={isSelected}
										onClick={() => handleFieldChange(field.id, opt.value)}
									>
										<Radio checked={isSelected} sx={{ p: 0, mt: 0.5 }} disableRipple />
										<Box>
											<Typography variant="subtitle1" fontWeight={isSelected ? 600 : 400}>
												{opt.label}
											</Typography>
											{opt.description && (
												<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
													{opt.description}
												</Typography>
											)}
										</Box>
									</OptionCard>
								);
							})}
						</Box>
					</FormControl>
				);

			case 'multiselect':
				return (
					<FormControl component="fieldset" fullWidth>
						<Typography variant="h6" gutterBottom color="text.primary" sx={{ mb: 2 }}>
							{field.label}
						</Typography>
						<Box>
							{field.options?.map((opt: ClarificationOption) => {
								const selectedValues = (answers[field.id] as string[]) || [];
								const isSelected = selectedValues.includes(opt.value);

								return (
									<OptionCard
										key={opt.value}
										selected={isSelected}
										onClick={() => handleMultiSelectChange(field.id, opt.value, !isSelected)}
									>
										<Checkbox checked={isSelected} sx={{ p: 0, mt: 0.5 }} disableRipple />
										<Box>
											<Typography variant="subtitle1" fontWeight={isSelected ? 600 : 400}>
												{opt.label}
											</Typography>
											{opt.description && (
												<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
													{opt.description}
												</Typography>
											)}
										</Box>
									</OptionCard>
								);
							})}
						</Box>
					</FormControl>
				);

			case 'textarea':
				return (
					<Box>
						<Typography variant="h6" gutterBottom color="text.primary">
							{field.label}
						</Typography>
						<TextField
							fullWidth
							multiline
							rows={4}
							placeholder={field.placeholder}
							value={answers[field.id] || ''}
							onChange={(e) => handleFieldChange(field.id, e.target.value)}
							helperText={field.description}
							variant="outlined"
							sx={{
								'& .MuiOutlinedInput-root': {
									bgcolor: 'background.paper',
								},
							}}
						/>
					</Box>
				);

			case 'text':
			default:
				return (
					<Box>
						<Typography variant="h6" gutterBottom color="text.primary">
							{field.label}
						</Typography>
						<TextField
							fullWidth
							placeholder={field.placeholder}
							value={answers[field.id] || ''}
							onChange={(e) => handleFieldChange(field.id, e.target.value)}
							helperText={field.description}
							variant="outlined"
							sx={{
								'& .MuiOutlinedInput-root': {
									bgcolor: 'background.paper',
								},
							}}
						/>
					</Box>
				);
		}
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 800, mx: 'auto', p: 0 }}>
			{/* Context Card */}
			<Paper
				elevation={0}
				sx={{
					p: 3,
					mb: 4,
					bgcolor: 'background.paper',
					borderRadius: 2,
					border: '1px solid',
					borderColor: 'divider',
				}}
			>
				<Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
					{request.context.title}
				</Typography>
				<Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2, color: 'text.secondary' }}>
					{request.context.description}
				</Typography>
				{request.context.reason && (
					<Alert
						severity="info"
						icon={<HelpIcon fontSize="inherit" />}
						sx={{
							mt: 2,
							bgcolor: 'rgba(74, 144, 164, 0.1)',
							color: 'info.light',
							'& .MuiAlert-icon': { color: 'info.main' },
							border: '1px solid',
							borderColor: 'rgba(74, 144, 164, 0.2)',
						}}
					>
						{request.context.reason}
					</Alert>
				)}
			</Paper>

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
				{request.fields.map((field) => (
					<Box key={field.id} sx={{ animation: 'fadeIn 0.5s ease-in' }}>
						{renderField(field)}
					</Box>
				))}
			</Box>

			<Divider sx={{ my: 4 }} />

			<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
				{request.options.allowSkip && (
					<Button variant="outlined" onClick={handleSkip} disabled={isSubmitting} sx={{ px: 4 }}>
						{request.options.skipLabel || 'Пропустить'}
					</Button>
				)}
				<Button variant="contained" size="large" onClick={handleSubmit} disabled={isSubmitting} sx={{ px: 4, py: 1.5 }}>
					{isSubmitting ? <CircularProgress size={24} color="inherit" /> : request.options.submitLabel || 'Отправить'}
				</Button>
			</Box>
		</Box>
	);
};
