import React from 'react';
import { useUnit } from 'effector-react';
import { Box, Typography, TextField, Button, CircularProgress, Chip, Paper, Alert } from '@mui/material';
import {
	$questions,
	$answers,
	$analysis,
	$sessionId,
	$error,
	$isSubmittingAnswers,
	setAnswer,
	submitAnswersFx,
	clearError,
} from '../../model';

export const QuestionForm: React.FC = () => {
	const questions = useUnit($questions);
	const answers = useUnit($answers);
	const analysis = useUnit($analysis);
	const sessionId = useUnit($sessionId);
	const error = useUnit($error);
	const isLoading = useUnit($isSubmittingAnswers);

	const handleSetAnswer = useUnit(setAnswer);
	const handleSubmitAnswers = useUnit(submitAnswersFx);
	const handleClearError = useUnit(clearError);

	const handleAnswerChange = (questionId: string, value: string) => {
		handleSetAnswer({ questionId, value });
	};

	const handleGenerateWithAnswers = () => {
		if (sessionId) {
			handleSubmitAnswers({ sessionId, answers });
		}
	};

	const handleAutoGenerate = () => {
		if (sessionId) {
			handleSubmitAnswers({ sessionId, answers: {} });
		}
	};

	return (
		<Box sx={{ display: 'flex', gap: 4, height: '100%' }}>
			<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
				<Box>
					<Typography variant="h5" gutterBottom>
						Уточните детали мира
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Ответьте на вопросы или оставьте поля пустыми / напишите "решай сам" для автогенерации
					</Typography>
				</Box>

				{error && (
					<Alert severity="error" onClose={handleClearError}>
						{error}
					</Alert>
				)}

				{questions.length === 0 && !isLoading && (
					<Alert severity="info">Достаточно информации для генерации мира. Нажмите "Сгенерировать мир".</Alert>
				)}

				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
					{questions.map((q) => (
						<Paper key={q.id} sx={{ p: 3, bgcolor: 'background.default' }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
								<Chip label={q.category} size="small" color="primary" variant="outlined" />
							</Box>
							<Typography variant="subtitle1" fontWeight="medium" gutterBottom>
								{q.text}
							</Typography>
							<TextField
								fullWidth
								multiline
								rows={3}
								placeholder='Ваш ответ или оставьте пустым / напишите "решай сам"'
								value={answers[q.id] || ''}
								onChange={(e) => handleAnswerChange(q.id, e.target.value)}
								disabled={isLoading}
							/>
						</Paper>
					))}
				</Box>

				<Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
					<Button variant="contained" size="large" onClick={handleGenerateWithAnswers} disabled={isLoading}>
						{isLoading ? <CircularProgress size={24} /> : 'Сгенерировать мир'}
					</Button>
					<Button variant="outlined" size="large" onClick={handleAutoGenerate} disabled={isLoading}>
						Полная автогенерация
					</Button>
				</Box>
			</Box>

			{/* Knowledge Base Panel */}
			<Box sx={{ width: 300, display: 'flex', flexDirection: 'column', gap: 2 }}>
				<Typography variant="h6">База знаний</Typography>

				<Box>
					<Typography variant="subtitle2" gutterBottom>
						Известная информация:
					</Typography>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
						{analysis?.known_info.map((info, idx) => (
							<Chip
								key={idx}
								label={info.length > 30 ? info.substring(0, 30) + '...' : info}
								title={info}
								size="small"
								color="success"
							/>
						))}
						{(!analysis?.known_info || analysis.known_info.length === 0) && (
							<Typography variant="body2" color="text.secondary">
								Нет данных
							</Typography>
						)}
					</Box>
				</Box>

				<Box>
					<Typography variant="subtitle2" gutterBottom>
						Недостающая информация:
					</Typography>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
						{analysis?.missing_info.map((info, idx) => (
							<Chip key={idx} label={info} color="warning" size="small" variant="outlined" />
						))}
						{(!analysis?.missing_info || analysis.missing_info.length === 0) && (
							<Typography variant="body2" color="text.secondary">
								Нет данных
							</Typography>
						)}
					</Box>
				</Box>

				<Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
					<Typography variant="caption" color="info.dark">
						💡 Совет: Во время генерации агенты могут задавать уточняющие вопросы для создания более качественного мира
					</Typography>
				</Box>
			</Box>
		</Box>
	);
};



