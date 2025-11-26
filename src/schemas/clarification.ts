import { z } from "zod";

export const ClarificationFieldTypeSchema = z.enum([
  "text",
  "textarea",
  "select",
  "multiselect",
  "radio",
  "checkbox",
  "slider",
  "confirm",
  "custom",
]);

export const ClarificationOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

export const ClarificationFieldSchema = z.object({
  id: z.string(),
  type: ClarificationFieldTypeSchema,
  label: z.string(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(ClarificationOptionSchema).optional(),
  validation: z
    .object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  defaultValue: z
    .union([z.string(), z.array(z.string()), z.boolean(), z.number()])
    .optional(),
  conditional: z
    .object({
      dependsOn: z.string(),
      showWhen: z.array(z.string()),
    })
    .optional(),
});

export const ClarificationRequestSchema = z.object({
  id: z.string(),
  type: z.literal("clarification"),
  context: z.object({
    title: z.string(),
    description: z.string(),
    currentNode: z.string(),
    reason: z.string(),
  }),
  fields: z.array(ClarificationFieldSchema),
  options: z.object({
    allowSkip: z.boolean(),
    skipLabel: z.string().optional(),
    submitLabel: z.string(),
    timeout: z.number().optional(),
  }),
  meta: z.object({
    generatedAt: z.string(),
    estimatedImpact: z.enum(["minor", "moderate", "significant"]),
  }),
});

export const ClarificationResponseSchema = z.object({
  requestId: z.string(),
  skipped: z.boolean(),
  answers: z.record(
    z.string(),
    z.union([z.string(), z.array(z.string()), z.boolean(), z.number()])
  ),
});

export type ClarificationFieldType = z.infer<typeof ClarificationFieldTypeSchema>;
export type ClarificationOption = z.infer<typeof ClarificationOptionSchema>;
export type ClarificationField = z.infer<typeof ClarificationFieldSchema>;
export type ClarificationRequest = z.infer<typeof ClarificationRequestSchema>;
export type ClarificationResponse = z.infer<typeof ClarificationResponseSchema>;



