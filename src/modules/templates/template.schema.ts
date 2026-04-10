import { z } from 'zod';

const exerciseSchema = z.object({
  id: z.string().uuid().optional(), // omit on create, required on update for upsert
  name: z.string().min(1).max(200),
  notes: z.string().max(500).nullish(), // nullable from DB export
  timerConfig: z.record(z.unknown()),
  targetSets: z.number().int().min(1).nullish(),
  targetReps: z.number().int().min(1).nullish(),
  targetWeight: z.number().min(0).nullish(),
  weightUnit: z.enum(['lbs', 'kg']).default('lbs'),
  restBetweenSets: z.number().int().min(0).default(90),
  orderIndex: z.number().int().min(0),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullish(),
  tags: z.array(z.string()).default([]),
  suggestedWeekdays: z.array(z.number().int().min(0).max(6)).default([]),
  estimatedMinutes: z.number().int().min(1).max(600),
  sortOrder: z.number().int().min(0).default(0),
  exercises: z.array(exerciseSchema).default([]),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  suggestedWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
  estimatedMinutes: z.number().int().min(1).max(600).optional(),
  isArchived: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  exercises: z.array(exerciseSchema).optional(),
});

export const listTemplatesSchema = z.object({
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  archived: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

export const importTemplatesSchema = z.array(createTemplateSchema);

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type ListTemplatesQuery = z.infer<typeof listTemplatesSchema>;
