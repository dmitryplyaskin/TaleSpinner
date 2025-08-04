# World Creation с интегрированной навигацией

Система создания мира, интегрированная с новой навигационной системой TaleSpinner.

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

### WorldCreationNavigationProvider

Провайдер навигации для World Creation, использующий новую систему навигации.

```tsx
<WorldCreationNavigationProvider>
	<YourComponent />
</WorldCreationNavigationProvider>
```

### useWorldCreationNavigation

Хук для доступа к функциям навигации в рамках World Creation.

```tsx
const {
	currentStep,
	currentBranch,
	currentStepIndex,
	totalSteps,
	canGoNext,
	canGoPrev,
	nextStep,
	prevStep,
	goToStep,
	updateCurrentStepData,
	isStep,
} = useWorldCreationNavigation();
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

## Компоненты шагов

### WorldSetupStep

Первый шаг - выбор типа мира. Адаптирован из `WorldSelectionScreen`.

```tsx
<WorldSetupStep />
```

### CreateWorld

Второй шаг - выбор конкретного мира из сгенерированных вариантов.

```tsx
<CreateWorld />
```

## Расширение

Для добавления новых шагов:

1. Добавьте новый шаг в массив `WORLD_CREATION_STEPS`
2. Добавьте соответствующий case в `renderStepContent()`
3. При необходимости создайте новый компонент для шага

Степпер автоматически адаптируется к любому количеству шагов.

## Интеграция с навигационной системой

World Creation теперь использует централизованную систему навигации:

- **Ветка**: `world-creation` (дочерняя от `main`)
- **Автосохранение**: Данные каждого шага сохраняются автоматически
- **История**: Полная история переходов между шагами
- **Гибкость**: Возможность добавления подветок для сложных сценариев

## Текущие шаги

1. **world-type-selection** (`WorldSetupStep`) - выбор базового типа мира
   - Сохраняет: `worldType`, `additionalInfo`, `completed`
2. **world-selection** (`CreateWorld`) - выбор конкретного мира
   - Сохраняет: `selectedWorld`, `completed`
3. **world-customization** - финальная настройка мира (пока заглушка)
   - Сохраняет: `finalSettings`

## Преимущества новой системы

- ✅ **Автосохранение** прогресса
- ✅ **История навигации** с возможностью отката
- ✅ **Данные шагов** сохраняются в централизованном хранилище
- ✅ **Расширяемость** через подветки
- ✅ **Унифицированная навигация** по всему приложению
