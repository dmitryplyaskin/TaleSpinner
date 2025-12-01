import { z } from "zod";
import { GenreSchema } from "./genre.schema";

/**
 * Статусы сессии создания мира
 */
export const SessionStatusSchema = z.enum([
  "genre_selected",
  "input_provided",
  "architect_working",
  "architect_asking",
  "skeleton_ready",
  "skeleton_approved",
  "elements_generating",
  "elements_asking",
  "completed",
  "saved",
]);

export type SessionStatus = z.infer<typeof SessionStatusSchema>;

/**
 * Схема сессии создания мира
 */
export const SessionSchema = z.object({
  id: z.string().uuid(),
  status: SessionStatusSchema,
  genre: GenreSchema,
  userInput: z.string(),
  architectIterations: z.number().default(0),
  langgraphThreadId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * Схема для создания новой сессии
 */
export const CreateSessionSchema = z.object({
  genre: GenreSchema,
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

/**
 * Схема для обновления сессии
 */
export const UpdateSessionSchema = SessionSchema.partial().omit({
  id: true,
  createdAt: true,
});

export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
