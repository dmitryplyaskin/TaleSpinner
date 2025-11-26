import React from 'react';
import { useUnit } from 'effector-react';
import { Box, TextField, Typography, Button, Paper, Chip } from '@mui/material';
import { Lightbulb, AutoAwesome } from '@mui/icons-material';
import {
	$userInput,
	$sessionId,
	$isAnalyzing,
	setUserInput,
	analyzeInputFx,
} from '../../../../model/agent-wizard';

const suggestions = [
	'Летающие острова',
	'Магические школы',
	'Древние руины',
	'Политические интриги',
	'Война фракций',
	'Запретная магия',
	'Драконы',
	'Подземные города',
];

export const WorldInput: React.FC = () => {
	const userInput = useUnit($userInput);
	const sessionId = useUnit($sessionId);
	const isAnalyzing = useUnit($isAnalyzing);
	const handleSetUserInput = useUnit(setUserInput);
	const handleAnalyze = useUnit(analyzeInputFx);

	const handleSuggestionClick = (suggestion: string) => {
		const newValue = userInput ? `${userInput}, ${suggestion.toLowerCase()}` : suggestion.toLowerCase();
		handleSetUserInput(newValue);
	};

	const handleSurpriseMe = () => {
		handleSetUserInput('Удиви меня! Создай уникальный и интересный мир на твоё усмотрение.');
		if (sessionId) {
			handleAnalyze({
				sessionId,
				userInput: 'Удиви меня! Создай уникальный и интересный мир на твоё усмотрение.',
			});
		}
	};

	const handleNext = () => {
		if (sessionId) {
			handleAnalyze({ sessionId, userInput });
		}
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
			<Box sx={{ textAlign: 'center', mb: 2 }}>
				<Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
					Опишите ваш мир
				</Typography>
				<Typography variant="body1" color="text.secondary">
					Расскажите о мире, который хотите создать. Упомяните фракции, локации, атмосферу или особых персонажей. Чем
					больше деталей — тем лучше результат.
				</Typography>
			</Box>

			{/* Suggestions */}
			<Paper
				sx={{
					p: 2,
					bgcolor: 'rgba(212, 175, 55, 0.05)',
					border: '1px dashed',
					borderColor: 'divider',
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
					<Lightbulb sx={{ fontSize: 20, color: 'primary.main' }} />
					<Typography variant="subtitle2" color="text.secondary">
						Идеи для вдохновения (нажмите, чтобы добавить):
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
					{suggestions.map((suggestion) => (
						<Chip
							key={suggestion}
							label={suggestion}
							size="small"
							onClick={() => handleSuggestionClick(suggestion)}
							sx={{
								cursor: 'pointer',
								'&:hover': {
									bgcolor: 'rgba(212, 175, 55, 0.2)',
									borderColor: 'primary.main',
								},
							}}
						/>
					))}
				</Box>
			</Paper>

			{/* Main Input */}
			<TextField
				multiline
				rows={8}
				fullWidth
				value={userInput}
				onChange={(e) => handleSetUserInput(e.target.value)}
				placeholder="Мир плавающих островов, где небесные пираты сражаются с наездниками на драконах за контроль над древними артефактами..."
				disabled={isAnalyzing}
				sx={{
					'& .MuiOutlinedInput-root': {
						fontSize: '1.1rem',
						lineHeight: 1.6,
					},
				}}
			/>

			{/* Character Counter */}
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant="caption" color="text.secondary">
					{userInput.length > 0 ? `${userInput.length} символов` : 'Минимум 20 символов для анализа'}
				</Typography>
				{userInput.length >= 100 && <Chip label="Отличное описание!" size="small" color="success" variant="outlined" />}
			</Box>

			{/* Actions */}
			<Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
				<Button
					variant="outlined"
					onClick={handleSurpriseMe}
					startIcon={<AutoAwesome />}
					disabled={isAnalyzing}
					sx={{ minWidth: 180 }}
				>
					Удиви меня
				</Button>
				<Button
					variant="contained"
					onClick={handleNext}
					disabled={userInput.trim().length < 20 || isAnalyzing}
					sx={{ minWidth: 180 }}
				>
					{isAnalyzing ? 'Анализирую...' : 'Анализировать'}
				</Button>
			</Box>

			{/* Help Text */}
			<Paper
				sx={{
					p: 2,
					bgcolor: 'rgba(74, 144, 164, 0.1)',
					border: '1px solid',
					borderColor: 'info.dark',
				}}
			>
				<Typography variant="body2" color="info.light">
					💡 <strong>Совет:</strong> Вы можете описать мир кратко или подробно. Если чего-то не хватает, система задаст
					уточняющие вопросы на следующем шаге. Также можно написать "удиви меня" или "решай сам", чтобы AI создал мир
					самостоятельно.
				</Typography>
			</Paper>
		</Box>
	);
};
