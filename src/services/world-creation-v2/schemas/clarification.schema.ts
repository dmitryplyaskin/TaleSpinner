import { z } from "zod";
import { ArchitectClarificationSchema } from "./architect.schema";
import { ElementsClarificationRequestSchema } from "./world-elements.schema";

/**
 * Объединённый тип для любого запроса уточнений
 */
export const AnyClarificationRequestSchema = z.discriminatedUnion("type", [
  ArchitectClarificationSchema,
  ElementsClarificationRequestSchema,
]);

export type AnyClarificationRequest = z.infer<typeof AnyClarificationRequestSchema>;

/**
 * Ответ пользователя на любой запрос уточнений
 */
export const ClarificationResponseSchema = z.object({
  requestId: z.string(),
  skipped: z.boolean().default(false),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

export type ClarificationResponse = z.infer<typeof ClarificationResponseSchema>;

/**
 * Запись истории уточнений в БД
 */
export const ClarificationRecordSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  clarificationType: z.enum(["architect", "elements"]),
  request: AnyClarificationRequestSchema,
  response: ClarificationResponseSchema.optional(),
  createdAt: z.string().datetime(),
});

export type ClarificationRecord = z.infer<typeof ClarificationRecordSchema>;

