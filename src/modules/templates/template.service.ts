import prisma from '@/config/database';
import { createError } from '@/middleware/errorHandler';
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  ListTemplatesQuery,
} from './template.schema';

const exerciseSelect = {
  id: true,
  name: true,
  notes: true,
  timerConfig: true,
  targetSets: true,
  targetReps: true,
  targetWeight: true,
  weightUnit: true,
  restBetweenSets: true,
  orderIndex: true,
};

const templateWithExercises = {
  id: true,
  name: true,
  description: true,
  tags: true,
  suggestedWeekdays: true,
  estimatedMinutes: true,
  isArchived: true,
  isPublic: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  exercises: {
    select: exerciseSelect,
    orderBy: { orderIndex: 'asc' as const },
  },
};

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listTemplates(userId: string, query: ListTemplatesQuery) {
  const { search, tags, archived } = query;

  const tagList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return prisma.workoutTemplate.findMany({
    where: {
      userId,
      deletedAt: null,
      isArchived: archived ?? false,
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
      ...(tagList.length > 0 && {
        tags: { hasSome: tagList },
      }),
    },
    select: templateWithExercises,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

// ─── Get one ──────────────────────────────────────────────────────────────────

export async function getTemplate(userId: string, templateId: string) {
  const template = await prisma.workoutTemplate.findFirst({
    where: { id: templateId, userId, deletedAt: null },
    select: templateWithExercises,
  });
  if (!template) throw createError('Template not found', 404, 'NOT_FOUND');
  return template;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createTemplate(userId: string, input: CreateTemplateInput) {
  return prisma.workoutTemplate.create({
    data: {
      userId,
      name: input.name,
      description: input.description,
      tags: input.tags,
      suggestedWeekdays: input.suggestedWeekdays,
      estimatedMinutes: input.estimatedMinutes,
      sortOrder: input.sortOrder,
      exercises: {
        create: input.exercises.map((ex) => ({
          name: ex.name,
          notes: ex.notes,
          timerConfig: ex.timerConfig,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          targetWeight: ex.targetWeight,
          weightUnit: ex.weightUnit,
          restBetweenSets: ex.restBetweenSets,
          orderIndex: ex.orderIndex,
        })),
      },
    },
    select: templateWithExercises,
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateTemplate(
  userId: string,
  templateId: string,
  input: UpdateTemplateInput,
) {
  const existing = await prisma.workoutTemplate.findFirst({
    where: { id: templateId, userId, deletedAt: null },
  });
  if (!existing) throw createError('Template not found', 404, 'NOT_FOUND');

  return prisma.$transaction(async (tx) => {
    // Update template fields
    await tx.workoutTemplate.update({
      where: { id: templateId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.suggestedWeekdays !== undefined && {
          suggestedWeekdays: input.suggestedWeekdays,
        }),
        ...(input.estimatedMinutes !== undefined && {
          estimatedMinutes: input.estimatedMinutes,
        }),
        ...(input.isArchived !== undefined && { isArchived: input.isArchived }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
    });

    // Upsert exercises if provided
    if (input.exercises !== undefined) {
      const incomingIds = input.exercises.filter((e) => e.id).map((e) => e.id!);

      // Delete exercises not in the new list
      await tx.exerciseDefinition.deleteMany({
        where: { templateId, id: { notIn: incomingIds } },
      });

      // Upsert each exercise
      for (const ex of input.exercises) {
        if (ex.id) {
          await tx.exerciseDefinition.update({
            where: { id: ex.id },
            data: {
              name: ex.name,
              notes: ex.notes,
              timerConfig: ex.timerConfig,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
              targetWeight: ex.targetWeight,
              weightUnit: ex.weightUnit,
              restBetweenSets: ex.restBetweenSets,
              orderIndex: ex.orderIndex,
            },
          });
        } else {
          await tx.exerciseDefinition.create({
            data: {
              templateId,
              name: ex.name,
              notes: ex.notes,
              timerConfig: ex.timerConfig,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
              targetWeight: ex.targetWeight,
              weightUnit: ex.weightUnit,
              restBetweenSets: ex.restBetweenSets,
              orderIndex: ex.orderIndex,
            },
          });
        }
      }
    }

    return tx.workoutTemplate.findUniqueOrThrow({
      where: { id: templateId },
      select: templateWithExercises,
    });
  });
}

// ─── Soft-delete ──────────────────────────────────────────────────────────────

export async function deleteTemplate(userId: string, templateId: string): Promise<void> {
  const existing = await prisma.workoutTemplate.findFirst({
    where: { id: templateId, userId, deletedAt: null },
  });
  if (!existing) throw createError('Template not found', 404, 'NOT_FOUND');

  await prisma.workoutTemplate.update({
    where: { id: templateId },
    data: { deletedAt: new Date() },
  });
}

// ─── Duplicate ────────────────────────────────────────────────────────────────

export async function duplicateTemplate(userId: string, templateId: string) {
  const source = await prisma.workoutTemplate.findFirst({
    where: { id: templateId, userId, deletedAt: null },
    include: { exercises: { orderBy: { orderIndex: 'asc' } } },
  });
  if (!source) throw createError('Template not found', 404, 'NOT_FOUND');

  return prisma.workoutTemplate.create({
    data: {
      userId,
      name: `${source.name} (copy)`,
      description: source.description,
      tags: source.tags,
      suggestedWeekdays: source.suggestedWeekdays,
      estimatedMinutes: source.estimatedMinutes,
      sortOrder: source.sortOrder,
      exercises: {
        create: source.exercises.map((ex) => ({
          name: ex.name,
          notes: ex.notes,
          timerConfig: ex.timerConfig,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          targetWeight: ex.targetWeight,
          weightUnit: ex.weightUnit,
          restBetweenSets: ex.restBetweenSets,
          orderIndex: ex.orderIndex,
        })),
      },
    },
    select: templateWithExercises,
  });
}

// ─── Import ───────────────────────────────────────────────────────────────────

export async function importTemplates(
  userId: string,
  templates: CreateTemplateInput[],
) {
  const created = await prisma.$transaction(
    templates.map((input) =>
      prisma.workoutTemplate.create({
        data: {
          userId,
          name: input.name,
          description: input.description,
          tags: input.tags,
          suggestedWeekdays: input.suggestedWeekdays,
          estimatedMinutes: input.estimatedMinutes,
          sortOrder: input.sortOrder,
          exercises: {
            create: input.exercises.map((ex) => ({
              name: ex.name,
              notes: ex.notes,
              timerConfig: ex.timerConfig,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
              targetWeight: ex.targetWeight,
              weightUnit: ex.weightUnit,
              restBetweenSets: ex.restBetweenSets,
              orderIndex: ex.orderIndex,
            })),
          },
        },
        select: templateWithExercises,
      }),
    ),
  );
  return created;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportTemplates(userId: string) {
  return prisma.workoutTemplate.findMany({
    where: { userId, deletedAt: null },
    select: templateWithExercises,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

// ─── Today's suggestion ───────────────────────────────────────────────────────

export async function getTodaysSuggestion(userId: string) {
  const weekday = new Date().getDay(); // 0=Sun..6=Sat

  const candidates = await prisma.workoutTemplate.findMany({
    where: {
      userId,
      isArchived: false,
      deletedAt: null,
      suggestedWeekdays: { has: weekday },
    },
    select: templateWithExercises,
  });

  if (candidates.length === 0) return null;

  const recentSessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      templateId: { in: candidates.map((c) => c.id) },
      deletedAt: null,
    },
    orderBy: { startedAt: 'desc' },
    distinct: ['templateId'],
    select: { templateId: true, startedAt: true },
  });

  const lastDoneMap = new Map(recentSessions.map((s) => [s.templateId, s.startedAt]));

  const sorted = [...candidates].sort((a, b) => {
    const aDate = lastDoneMap.get(a.id)?.getTime() ?? 0;
    const bDate = lastDoneMap.get(b.id)?.getTime() ?? 0;
    return aDate - bDate;
  });

  return sorted[0];
}
