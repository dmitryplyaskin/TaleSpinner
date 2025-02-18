import { CommonModelItemType } from "./common-model-types";

/**
 * Представляет карточку агента/персонажа, которая содержит основную информацию,
 * историю взаимодействий и дополнительные данные (metadata) для разных сценариев.
 */
export interface AgentCard extends CommonModelItemType {
  /** Версия карточки */
  version?: string;
  /** Уникальный идентификатор карточки */
  id: string;
  /** Название или имя агента/персонажа */
  name: string;
  /** Дата и время создания карточки (строка в формате ISO-8601) */
  createdAt: string;
  /** Дата и время последнего обновления карточки */
  updatedAt: string;
  /** Последний выбранный вариант ответа (свайп) */
  lastSwipe?: Swipe;
  /** Системная подсказка, влияющая на поведение агента */
  systemPrompt?: string;
  /** Вступительные варианты (свайпы), которые могут быть показаны при инициализации диалога */
  introSwipes: InteractionMessage;
  /** Ветки взаимодействий (истории/сценарии общения) */
  interactionBranches: InteractionBranch[];
  /** Идентификатор активной ветки взаимодействия */
  activeBranchId: string | null;
  /** Дополнительные данные, например, характеристики агента/персонажа */
  metadata?: Record<string, any>;
  /** Оценка карточки (например, от 1 до 5) */
  rating?: "1" | "2" | "3" | "4" | "5";
  /** Флаг, указывающий на избранную карточку */
  isFavorite?: boolean;
  /** Путь к изображению, например, аватару или иллюстрации */
  avatarPath?: string;
  /** Текущая активная ветка взаимодействия */
  activeBranch?: ActiveBranch;
}

/**
 * Представляет отдельную ветку взаимодействия (историю или сценарий диалога).
 */
export interface InteractionBranch {
  /** Уникальный идентификатор ветки */
  id: string;
  /** Название ветки, например, "Битва" или "Разговор в таверне" */
  name?: string;
  /** Дата создания ветки (строка в формате ISO-8601) */
  createdAt: string;
  /** Флаг, указывающий, является ли ветка начатой */
  isStarted?: boolean;
  /** Сообщения (взаимодействия) в рамках этой ветки */
  messages: InteractionMessage[];
}

/**
 * Представляет отдельное сообщение в ветке взаимодействия.
 * Сообщение может содержать несколько вариантов ответа (свайпов).
 */
export interface InteractionMessage {
  /** Уникальный идентификатор сообщения */
  id: string;
  /** Тип сообщения; на данный момент используется значение 'default' */
  type: "default";
  /** Варианты (свайпы) сообщения, каждый из которых может содержать несколько компонентов */
  swipes: Swipe[];
  /** Роль отправителя сообщения: пользователь, ассистент или система */
  role: "user" | "assistant" | "system";
  /** Время отправки сообщения (ISO-8601 строка) */
  timestamp: string;
  /** Идентификатор активного (выбранного) свайпа из массива swipes */
  activeSwipeId: string;
  /** Флаг, указывающий, является ли сообщение вступительным */
  isIntro?: boolean;
  /** Флаг, указывающий, является ли сообщение последним в ветке */
  isLast?: boolean;
  /** Информация о пользователе */
  userPersonInfo?: {
    /** Имя пользователя */
    name: string;
    /** Путь к изображению пользователя */
    imagePath: string;
  };
}

/**
 * Представляет свайп — единицу ответа, которая может состоять из нескольких компонентов.
 */
export interface Swipe {
  /** Уникальный идентификатор свайпа */
  id: string;
  /** Содержимое свайпа (например, основной ответ, анализ) */
  components: SwipeComponent[];
  /** Время создания свайпа (ISO-8601 строка) */
  timestamp: string;
}

/**
 * Представляет отдельный компонент внутри свайпа.
 * Позволяет гибко комбинировать различные типы данных в одном свайпе.
 */
export interface SwipeComponent {
  /** Уникальный идентификатор компонента */
  id: string;
  /** Тип компонента. Возможные значения: 'chainOfThought', 'answer', 'analysis' или любые другие строки */
  type: SwipeComponentType;
  /** Содержимое компонента, например текст ответа или анализ */
  content: string;
  /** Флаг, указывающий, должен ли компонент быть показан пользователю */
  showToUser?: boolean;
}

/** Тип, описывающий возможные типы компонентов внутри свайпа */
export type SwipeComponentType = "reasoning" | "answer" | "any" | string;

/**
 * Представляет активную ветку взаимодействия — ветку, с которой в данный момент происходит диалог.
 */
export interface ActiveBranch {
  /** Ссылка на ветку взаимодействия */
  branch: InteractionBranch;
  /** Сообщения, относящиеся к активной ветке */
  messages: InteractionMessage[];
}
