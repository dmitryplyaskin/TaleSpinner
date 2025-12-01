import { z } from "zod";

/**
 * Опция ответа для вопроса архитектора
 */
export const ArchitectQuestionOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export type ArchitectQuestionOption = z.infer<typeof ArchitectQuestionOptionSchema>;

/**
 * Вопрос с вариантами ответов для HITL
 */
export const ArchitectQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(ArchitectQuestionOptionSchema).length(3),
  allowCustomAnswer: z.boolean().default(true),
});

export type ArchitectQuestion = z.infer<typeof ArchitectQuestionSchema>;

/**
 * Запрос уточнений от архитектора
 */
export const ArchitectClarificationSchema = z.object({
  type: z.literal("architect_clarification"),
  reason: z.string(),
  questions: z.array(ArchitectQuestionSchema).min(1).max(5),
  iteration: z.number(),
});

export type ArchitectClarification = z.infer<typeof ArchitectClarificationSchema>;

/**
 * Элементы мира, которые можно сгенерировать
 */
export const WorldElementTypeSchema = z.enum([
  "locations",
  "factions",
  "religions",
  "races",
  "magic_system",
  "technology",
  "history",
  "economy",
  "culture",
  "creatures",
  "notable_characters",
]);

export type WorldElementType = z.infer<typeof WorldElementTypeSchema>;

/**
 * Скелет мира - основа для дальнейшей генерации
 */
export const WorldSkeletonSchema = z.object({
  name: z.string().describe("Название мира"),
  setting: z
    .string()
    .describe("Тип сеттинга: fantasy, sci-fi, modern, post-apocalyptic и т.д."),
  era: z.string().describe("Эпоха/временной период"),
  tone: z.string().describe("Общий тон мира"),
  coreConflict: z.string().describe("Центральный конфликт мира"),
  uniqueFeatures: z.array(z.string()).describe("Уникальные особенности мира"),
  worldPrimer: z.string().describe("Краткое описание мира 2-3 абзаца"),
  elementsToGenerate: z
    .array(WorldElementTypeSchema)
    .describe("Какие элементы мира нужно сгенерировать"),
});

export type WorldSkeleton = z.infer<typeof WorldSkeletonSchema>;

/**
 * Результат работы архитектора (либо уточнение, либо скелет)
 */
export const ArchitectResultSchema = z.object({
  needsClarification: z.boolean(),
  clarification: ArchitectClarificationSchema.optional(),
  skeleton: WorldSkeletonSchema.optional(),
});

export type ArchitectResult = z.infer<typeof ArchitectResultSchema>;

/**
 * Ответ пользователя на вопросы архитектора
 */
export const ArchitectResponseSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export type ArchitectResponse = z.infer<typeof ArchitectResponseSchema>;

/**
 * История уточнений
 */
export const ClarificationHistoryItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export type ClarificationHistoryItem = z.infer<typeof ClarificationHistoryItemSchema>;

