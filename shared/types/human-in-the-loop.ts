// Типы полей формы
export type ClarificationFieldType =
  | "text" // Текстовое поле
  | "textarea" // Многострочный текст
  | "select" // Выбор из списка
  | "multiselect" // Множественный выбор
  | "radio" // Радио-кнопки
  | "checkbox" // Чекбоксы
  | "slider" // Слайдер (1-10)
  | "confirm" // Да/Нет
  | "custom"; // Свободный ввод с подсказкой

// Опция для select/radio/multiselect
export interface ClarificationOption {
  value: string;
  label: string;
  description?: string; // Подсказка при наведении
}

// Поле формы
export interface ClarificationField {
  id: string;
  type: ClarificationFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: ClarificationOption[]; // Для select/radio/multiselect
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number; // Для slider
    max?: number;
  };
  defaultValue?: string | string[] | boolean | number;
  conditional?: {
    dependsOn: string; // id другого поля
    showWhen: string[]; // значения при которых показывать
  };
}

// Запрос уточнения от агента
export interface ClarificationRequest {
  id: string;
  type: "clarification";

  // Контекст для пользователя
  context: {
    title: string; // "Уточнение деталей мира"
    description: string; // "Мне нужно больше информации о..."
    currentNode: string; // "factions" - какой агент спрашивает
    reason: string; // Почему нужно уточнение
  };

  // Поля формы
  fields: ClarificationField[];

  // Опции поведения
  options: {
    allowSkip: boolean; // Можно ли пропустить
    skipLabel?: string; // "Реши сам" / "Пропустить"
    submitLabel: string; // "Продолжить генерацию"
    timeout?: number; // Автоскип через N секунд (опционально)
  };

  // Мета-информация
  meta: {
    generatedAt: string;
    estimatedImpact: "minor" | "moderate" | "significant";
  };
}

// Ответ пользователя
export interface ClarificationResponse {
  requestId: string;
  skipped: boolean;
  answers: Record<string, string | string[] | boolean | number>;
}
