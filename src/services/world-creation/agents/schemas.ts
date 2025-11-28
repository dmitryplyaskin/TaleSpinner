import { z } from "zod";

// === Generation Configuration ===
// Определяет, какие модули мира будут сгенерированы
export const GenerationConfigSchema = z.object({
  hasFactions: z.boolean().describe("Generate political factions, guilds, or groups"),
  hasLocations: z.boolean().describe("Generate geography, cities, and landmarks"),
  hasRaces: z.boolean().describe("Generate distinct races or species (fantasy/sci-fi)"),
  hasHistory: z.boolean().describe("Generate timeline and historical events"),
  hasMagic: z.boolean().describe("Generate magic system or advanced technology"),
  hasCharacters: z.boolean().describe("Generate key NPC characters"),
});

export type GenerationConfig = z.infer<typeof GenerationConfigSchema>;

// === Architect Questions ===
// Вопросы с вариантами ответов для уточнения деталей
export const ArchitectQuestionSchema = z.object({
  id: z.string(),
  text: z.string().describe("The question text"),
  options: z.array(z.string()).describe("Suggested options for the user to choose from"),
  allowCustom: z.boolean().default(true).describe("Allow user to input custom answer"),
  category: z.string().describe("What category this question relates to (e.g., 'magic', 'tone')"),
});

export type ArchitectQuestion = z.infer<typeof ArchitectQuestionSchema>;

// === World Skeleton ===
// Черновик мира для утверждения пользователем
export const WorldSkeletonSchema = z.object({
  title: z.string().describe("Proposed working title for the world"),
  synopsis: z.string().describe("Short elevator pitch of the world (2-3 sentences)"),
  tone: z.string().describe("The overall mood and tone"),
  key_themes: z.array(z.string()).describe("List of 3-5 key themes"),
  config: GenerationConfigSchema.describe("The proposed generation configuration based on analysis"),
});

export type WorldSkeleton = z.infer<typeof WorldSkeletonSchema>;

// === Architect Response ===
// Ответ агента-архитектора
export const ArchitectResponseSchema = z.object({
  // Если информации недостаточно, возвращаем вопросы
  questions: z.array(ArchitectQuestionSchema).optional(),
  
  // Если информации достаточно (или после ответов), возвращаем скелет
  skeleton: WorldSkeletonSchema.optional(),
  
  // Флаг готовности (дублирует наличие скелета, для удобства)
  is_ready: z.boolean().describe("True if skeleton is generated, False if questions are needed"),
  
  // Обоснование решения (почему задаем вопросы или почему выбрали такой конфиг)
  reasoning: z.string().describe("Brief explanation of the architect's decisions"),
});

export type ArchitectResponse = z.infer<typeof ArchitectResponseSchema>;
