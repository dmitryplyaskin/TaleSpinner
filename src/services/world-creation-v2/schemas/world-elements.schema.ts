import { z } from "zod";
import { WorldSkeletonSchema } from "./architect.schema";

/**
 * Базовая структура для любого элемента мира
 */
export const WorldElementBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

export type WorldElementBase = z.infer<typeof WorldElementBaseSchema>;

/**
 * Динамическая схема элемента с произвольными полями
 */
export const DynamicWorldElementSchema = WorldElementBaseSchema.extend({
  fields: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

export type DynamicWorldElement = z.infer<typeof DynamicWorldElementSchema>;

/**
 * Категория элементов мира
 */
export const WorldElementCategorySchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  categoryDescription: z.string(),
  elements: z.array(DynamicWorldElementSchema),
});

export type WorldElementCategory = z.infer<typeof WorldElementCategorySchema>;

/**
 * Метаданные генерации
 */
export const GenerationMetadataSchema = z.object({
  generatedAt: z.string().datetime(),
  totalElements: z.number(),
  generationTimeMs: z.number(),
});

export type GenerationMetadata = z.infer<typeof GenerationMetadataSchema>;

/**
 * Полный результат генерации мира
 */
export const GeneratedWorldSchema = z.object({
  skeleton: WorldSkeletonSchema,
  categories: z.array(WorldElementCategorySchema),
  metadata: GenerationMetadataSchema,
});

export type GeneratedWorld = z.infer<typeof GeneratedWorldSchema>;

/**
 * Запрос уточнений при генерации элементов
 */
export const ElementsClarificationRequestSchema = z.object({
  type: z.literal("elements_clarification"),
  elementType: z.string(),
  reason: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
        })
      ),
      allowCustomAnswer: z.boolean().default(true),
    })
  ),
});

export type ElementsClarificationRequest = z.infer<
  typeof ElementsClarificationRequestSchema
>;

/**
 * Ответ пользователя на вопросы при генерации элементов
 */
export const ElementsClarificationResponseSchema = z.object({
  requestId: z.string(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

export type ElementsClarificationResponse = z.infer<
  typeof ElementsClarificationResponseSchema
>;

/**
 * Прогресс генерации элементов
 */
export const GenerationProgressSchema = z.object({
  currentElement: z.string(),
  completedElements: z.array(z.string()),
  totalElements: z.number(),
  status: z.enum(["idle", "generating", "waiting_for_input", "completed", "error"]),
  error: z.string().optional(),
});

export type GenerationProgress = z.infer<typeof GenerationProgressSchema>;

