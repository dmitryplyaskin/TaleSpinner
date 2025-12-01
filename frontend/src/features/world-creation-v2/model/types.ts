/**
 * Типы для WorldCreationV2 фронтенда
 */

// Re-export shared types
export type {
  Genre,
  GenreMetadataItem,
  Session,
  SessionStatus,
  ArchitectQuestion,
  ArchitectQuestionOption,
  ArchitectClarification,
  WorldSkeleton,
  WorldElementType,
  DynamicWorldElement,
  WorldElementCategory,
  GeneratedWorld,
  GenerationProgress,
  GenerationStatus,
  ElementsClarificationRequest,
  AnyClarificationRequest,
  ClarificationResponse,
} from "@shared/types/world-creation-v2";

/**
 * Шаги wizard
 */
export type WizardStepV2 =
  | "genre" // Шаг 1: Выбор жанра
  | "input" // Шаг 2: Ввод описания
  | "architect" // Шаг 3: HITL с архитектором
  | "skeleton_review" // Шаг 3.5: Просмотр/редактирование скелета
  | "generation" // Шаг 4: Генерация элементов
  | "review"; // Шаг 5: Финальный просмотр

/**
 * Метаданные шага для UI
 */
export interface StepMetadata {
  index: number;
  label: string;
  description: string;
}

/**
 * Маппинг шагов на метаданные
 */
export const STEP_METADATA: Record<WizardStepV2, StepMetadata> = {
  genre: {
    index: 0,
    label: "Жанр",
    description: "Выберите жанр сюжета",
  },
  input: {
    index: 1,
    label: "Описание",
    description: "Опишите ваш мир",
  },
  architect: {
    index: 2,
    label: "Уточнение",
    description: "Ответьте на вопросы",
  },
  skeleton_review: {
    index: 2,
    label: "Уточнение",
    description: "Проверьте основу мира",
  },
  generation: {
    index: 3,
    label: "Генерация",
    description: "Создание элементов мира",
  },
  review: {
    index: 4,
    label: "Результат",
    description: "Просмотр и редактирование",
  },
};

/**
 * Жанр с метаданными для UI
 */
export interface GenreWithMetadata {
  id: string;
  label: string;
  description: string;
  icon: string;
}

/**
 * Метаданные жанров
 */
export const GenreMetadata: Record<string, { label: string; description: string; icon: string }> = {
  adventure: { label: "Приключение", description: "Путешествия, квесты, исследования", icon: "compass" },
  mystery: { label: "Детектив", description: "Расследования, загадки, тайны", icon: "search" },
  slice_of_life: { label: "Повседневность", description: "Спокойная жизнь, отношения", icon: "coffee" },
  horror: { label: "Хоррор", description: "Страх, выживание, угрозы", icon: "ghost" },
  romance: { label: "Романтика", description: "Любовь, эмоциональные связи", icon: "heart" },
  drama: { label: "Драма", description: "Конфликты, развитие персонажей", icon: "theater" },
  action: { label: "Экшен", description: "Бои, погони, динамика", icon: "zap" },
  thriller: { label: "Триллер", description: "Напряжение, опасность, интриги", icon: "alert" },
  comedy: { label: "Комедия", description: "Юмор, абсурд, лёгкость", icon: "smile" },
  survival: { label: "Выживание", description: "Суровые условия, ресурсы", icon: "shield" },
  political_intrigue: { label: "Интриги", description: "Политика, заговоры, власть", icon: "crown" },
  heist: { label: "Ограбление", description: "Планирование, операции", icon: "key" },
};

