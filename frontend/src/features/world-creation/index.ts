/**
 * World Creation Feature - публичный API
 *
 * Фича для создания игровых миров с использованием AI-агентов.
 */

// UI компоненты
export { Wizard, GenreSelection, GenreCard } from './ui';
export type { GenreId, GenreOption } from './ui';

// Model (stores, events, effects)
export {
	// Stores
	$step,
	$sessionId,
	$setting,
	$userInput,
	$analysis,
	$questions,
	$answers,
	$generationProgress,
	$clarificationRequest,
	$worldData,
	$error,
	$exitDialogOpen,
	$isStartingSession,
	$isAnalyzing,
	$isSubmittingAnswers,
	$isGenerating,
	$isSaving,
	$isContinuing,
	$isLoading,
	// Events
	nextStep,
	prevStep,
	goToStep,
	setSetting,
	setUserInput,
	setAnswer,
	updateWorldData,
	setWorldData,
	updateProgress,
	setClarificationRequest,
	openExitDialog,
	closeExitDialog,
	resetWizard,
	clearError,
	setError,
	// Effects
	startSessionFx,
	analyzeInputFx,
	submitAnswersFx,
	generateWorldFx,
	saveWorldFx,
	fetchProgressFx,
	continueGenerationFx,
} from './model';

// Types
export type {
	WizardStep,
	WorldData,
	AgentQuestion,
	AgentAnalysis,
	AgentStatus,
	GenerationProgress,
	ClarificationRequest,
	ClarificationResponse,
	StreamEvent,
} from './model';
