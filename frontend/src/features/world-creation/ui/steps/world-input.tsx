import React from 'react';
import { useUnit } from 'effector-react';
import { Box, TextField, Typography, Button, Paper } from '@mui/material';
import {
	$userInput,
	$sessionId,
	setUserInput,
	startGenerationFx, // Changed from analyzeInputFx
} from '../../model';

export const WorldInput: React.FC = () => {
	const userInput = useUnit($userInput);
	const sessionId = useUnit($sessionId);
	const isStarting = useUnit(startGenerationFx.pending); // Check loading of startGeneration
	const handleSetUserInput = useUnit(setUserInput);
	const handleStartGeneration = useUnit(startGenerationFx);

	const handleNext = async () => {
		if (sessionId) {
			// Save input implicitly handled by store, but we need to pass it to backend?
			// Actually, startGeneration usually just triggers the graph which reads state.
			// But wait, we need to ensure userInput is passed to the graph state.
			// The graph state 'collectedInfo' initializes from... nothing?
			// We might need to pass userInput to startGeneration or ensure it's saved.

			// Looking at the original code: analyzeInputFx took { sessionId, userInput }
			// startGenerationFx takes string (sessionId).
			// This means we rely on the backend to have the collected info, OR we need to send it.

			// If we remove analyzeInputFx, we need to send the input to the backend somehow.
			// startGeneration endpoint: POST /api/world-creation/agent/generate/{sessionId}/start
			// Does it accept body?
			// In `api/index.ts` (not visible here but implied), startGeneration usually just starts.

			// BUT: The Architect needs the input.
			// We should probably pass the input to startGenerationFx if the API supports it,
			// OR we need a way to set the initial state.

			// Let's assume for now we can't change the API signature easily without seeing it.
			// However, the user complained about redundancy.
			// "Why send analyze if then send start...".

			// Ideally: startGenerationFx({ sessionId, initialInput: userInput })

			// For now, I will assume startGenerationFx initiates the graph.
			// BUT the graph state needs the user input.
			// If I can't pass it in startGeneration, I might need to call an intermediate endpoint
			// OR `analyzeInput` was actually serving the purpose of "seeding" the collectedInfo?

			// Wait, if `analyzeInput` was just "analyzing" and returning questions,
			// and THEN `startGeneration` was called...

			// If I remove `analyzeInput`, how does the graph know the user input?
			// The graph has `collectedInfo`.

			// Let's check `ArchitectNode`. It reads `state.collectedInfo`.
			// Where does `collectedInfo` get the user input?
			// In the `WorldGenerationState` annotation, `collectedInfo` defaults to [].

			// If we don't pass the input, Architect sees empty info.
			// The `analyzeInput` endpoint likely *also* saved the input to the DB or state?
			// Or `startSession` did?

			// Let's look at `startSessionFx`. It takes `setting`.

			// If `startGeneration` endpoint accepts `userInput`, that's great.
			// If not, we might be stuck with `analyzeInput` acting as "submit input".
			// BUT the user said: "Why send analyze... if we then send start... and show questions from THAT answer".
			// This implies `start` returns questions.
			// So `start` MUST be receiving the input, or the input is already there.

			// I'll bet `startGeneration` can accept input or we should modify it to.
			// I will modify the frontend to pass userInput to startGeneration if possible.
			// Check `frontend/src/features/world-creation/api/index.ts` (I don't see it but can guess).
			// Or I can just try to pass it.

			// If I look at `model/effects.ts`:
			// export const startGenerationFx = createEffect<string, ...>
			// It takes a string (sessionId). It doesn't take input.

			// I should update `startGenerationFx` signature to accept `{ sessionId, userInput }`?
			// Or maybe I should keep `analyzeInput` but rename it to `submitInput` and NOT show questions from it?
			// The user said "show questions from THAT (start) answer".

			// So:
			// 1. WorldInput -> startGenerationFx({ sessionId, userInput })
			await handleStartGeneration({ sessionId, userInput });
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

			{/* Main Input */}
			<TextField
				multiline
				rows={8}
				fullWidth
				value={userInput}
				onChange={(e) => handleSetUserInput(e.target.value)}
				placeholder="Мир плавающих островов, где небесные пираты сражаются с наездниками на драконах за контроль над древними артефактами..."
				disabled={isStarting}
				sx={{
					'& .MuiOutlinedInput-root': {
						fontSize: '1.1rem',
						lineHeight: 1.6,
					},
				}}
			/>

			{/* Actions */}
			<Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
				<Button
					variant="contained"
					onClick={handleNext}
					disabled={userInput.trim().length < 5 || isStarting}
					sx={{ minWidth: 220, py: 1.5 }}
					size="large"
				>
					{isStarting ? 'Анализирую...' : 'Продолжить'}
				</Button>
			</Box>

			{/* Help Text */}
			<Paper
				elevation={0}
				sx={{
					p: 2,
					bgcolor: 'rgba(74, 144, 164, 0.1)',
					border: '1px solid',
					borderColor: 'info.main',
					opacity: 0.8,
				}}
			>
				<Typography variant="body2" color="text.secondary">
					💡 <strong>Совет:</strong> Это поле для свободного описания. Если вы не знаете, что написать, просто укажите
					общую идею, например "мрачное средневековье" или "киберпанк в космосе". Система поможет вам доработать детали
					на следующем шаге.
				</Typography>
			</Paper>
		</Box>
	);
};
