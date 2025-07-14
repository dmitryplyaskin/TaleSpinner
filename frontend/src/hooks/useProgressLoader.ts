import { useState, useCallback, useRef } from 'react';
import { ProgressStep } from '../ui/ProgressLoader';

export interface ProgressTask {
	id: string;
	description: string;
	execute: (signal: AbortSignal) => Promise<any>;
}

interface UseProgressLoaderReturn {
	isLoading: boolean;
	steps: ProgressStep[];
	currentStep: number;
	error: string | null;
	executeWithProgress: (tasks: ProgressTask[], title?: string) => Promise<any[]>;
	cancel: () => void;
	reset: () => void;
}

export const useProgressLoader = (): UseProgressLoaderReturn => {
	const [isLoading, setIsLoading] = useState(false);
	const [steps, setSteps] = useState<ProgressStep[]>([]);
	const [currentStep, setCurrentStep] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const abortControllerRef = useRef<AbortController | null>(null);

	const reset = useCallback(() => {
		setIsLoading(false);
		setSteps([]);
		setCurrentStep(0);
		setError(null);
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
	}, []);

	const cancel = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		reset();
	}, [reset]);

	const executeWithProgress = useCallback(
		async (tasks: ProgressTask[], title?: string): Promise<any[]> => {
			// Сбрасываем предыдущее состояние
			reset();

			// Создаем новый AbortController для этой операции
			abortControllerRef.current = new AbortController();
			const signal = abortControllerRef.current.signal;

			// Инициализируем шаги
			const initialSteps: ProgressStep[] = tasks.map((task) => ({
				id: task.id,
				description: task.description,
				completed: false,
			}));

			setSteps(initialSteps);
			setIsLoading(true);
			setCurrentStep(0);

			const results: any[] = [];

			try {
				for (let i = 0; i < tasks.length; i++) {
					// Проверяем, не была ли операция отменена
					if (signal.aborted) {
						throw new Error('Операция отменена');
					}

					setCurrentStep(i);

					try {
						const result = await tasks[i].execute(signal);
						results.push(result);

						// Обновляем состояние выполненного шага
						setSteps((prev) => prev.map((step, index) => (index === i ? { ...step, completed: true } : step)));
					} catch (taskError) {
						if (signal.aborted) {
							throw new Error('Операция отменена');
						}
						throw taskError;
					}
				}

				// Все шаги выполнены успешно
				setCurrentStep(tasks.length);
				setIsLoading(false);
				abortControllerRef.current = null;

				return results;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
				setError(errorMessage);
				setIsLoading(false);
				abortControllerRef.current = null;
				throw err;
			}
		},
		[reset],
	);

	return {
		isLoading,
		steps,
		currentStep,
		error,
		executeWithProgress,
		cancel,
		reset,
	};
};
