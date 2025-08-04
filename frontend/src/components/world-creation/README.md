# World Creation Stepper

Расширяемый степпер для процесса создания мира в TaleSpinner.

## Компоненты

### WorldCreationStepper

Основной компонент степпера, отображающий текущий прогресс.

```tsx
<WorldCreationStepper
	steps={steps}
	activeStep={currentStep}
	orientation="horizontal" // или "vertical"
	alternativeLabel={true}
/>
```

### WorldCreationProvider

Контекст-провайдер для управления состоянием степпера.

```tsx
<WorldCreationProvider initialSteps={STEPS}>
	<YourComponent />
</WorldCreationProvider>
```

### useWorldCreationStepper

Хук для доступа к функциям степпера.

```tsx
const { currentStep, steps, goToStep, nextStep, prevStep, updateStep, canGoNext, canGoPrev } =
	useWorldCreationStepper();
```

### StepNavigation

Компонент для навигации между шагами.

```tsx
<StepNavigation
	showNext={true}
	showPrev={true}
	nextLabel="Далее"
	prevLabel="Назад"
	onNext={() => {}} // кастомная логика
	onPrev={() => {}} // кастомная логика
/>
```

## Типы

### StepConfig

```tsx
interface StepConfig {
	id: string;
	label: string;
	description?: string;
	completed?: boolean;
	disabled?: boolean;
}
```

## Пример использования

```tsx
const STEPS: StepConfig[] = [
	{
		id: 'setup',
		label: 'Настройка',
		description: 'Базовые параметры',
	},
	{
		id: 'selection',
		label: 'Выбор',
		description: 'Выберите опции',
	},
];

function MyComponent() {
	return (
		<WorldCreationProvider initialSteps={STEPS}>
			<WorldCreationStepper />
			<StepContent />
			<StepNavigation />
		</WorldCreationProvider>
	);
}
```

## Расширение

Для добавления новых шагов:

1. Добавьте новый шаг в массив `WORLD_CREATION_STEPS`
2. Добавьте соответствующий case в `renderStepContent()`
3. При необходимости создайте новый компонент для шага

Степпер автоматически адаптируется к любому количеству шагов.
