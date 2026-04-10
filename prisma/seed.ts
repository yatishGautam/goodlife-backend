import { PrismaClient, WeightUnit } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Seed Data ───────────────────────────────────────────────────────────────

const DEMO_EMAIL = 'demo@goodlife.app';
const DEMO_PASSWORD = 'demo1234';

const HYBRID_PROGRAM: {
  name: string;
  description: string;
  tags: string[];
  suggestedWeekdays: number[];
  estimatedMinutes: number;
  exercises: {
    name: string;
    timerConfig: object;
    targetSets: number;
    targetReps: number;
    targetWeight: number;
    restBetweenSets: number;
    orderIndex: number;
  }[];
}[] = [
  {
    name: 'Push Day',
    description: 'Chest, shoulders, triceps',
    tags: ['push', 'strength'],
    suggestedWeekdays: [1], // Monday
    estimatedMinutes: 60,
    exercises: [
      {
        name: 'Barbell Bench Press',
        timerConfig: { type: 'countdown', seconds: 90 },
        targetSets: 4,
        targetReps: 8,
        targetWeight: 185,
        restBetweenSets: 90,
        orderIndex: 0,
      },
      {
        name: 'Incline Dumbbell Press',
        timerConfig: { type: 'countdown', seconds: 75 },
        targetSets: 3,
        targetReps: 10,
        targetWeight: 65,
        restBetweenSets: 75,
        orderIndex: 1,
      },
      {
        name: 'Cable Lateral Raise',
        timerConfig: { type: 'countdown', seconds: 60 },
        targetSets: 3,
        targetReps: 15,
        targetWeight: 15,
        restBetweenSets: 60,
        orderIndex: 2,
      },
      {
        name: 'Overhead Press',
        timerConfig: { type: 'countdown', seconds: 90 },
        targetSets: 3,
        targetReps: 10,
        targetWeight: 115,
        restBetweenSets: 90,
        orderIndex: 3,
      },
      {
        name: 'Tricep Pushdown',
        timerConfig: { type: 'countdown', seconds: 60 },
        targetSets: 3,
        targetReps: 12,
        targetWeight: 55,
        restBetweenSets: 60,
        orderIndex: 4,
      },
    ],
  },
  {
    name: 'Pull Day',
    description: 'Back, biceps, rear delts',
    tags: ['pull', 'strength'],
    suggestedWeekdays: [2], // Tuesday
    estimatedMinutes: 60,
    exercises: [
      {
        name: 'Barbell Row',
        timerConfig: { type: 'countdown', seconds: 90 },
        targetSets: 4,
        targetReps: 8,
        targetWeight: 165,
        restBetweenSets: 90,
        orderIndex: 0,
      },
      {
        name: 'Pull-Up',
        timerConfig: { type: 'countdown', seconds: 90 },
        targetSets: 4,
        targetReps: 8,
        targetWeight: 0,
        restBetweenSets: 90,
        orderIndex: 1,
      },
      {
        name: 'Seated Cable Row',
        timerConfig: { type: 'countdown', seconds: 75 },
        targetSets: 3,
        targetReps: 12,
        targetWeight: 130,
        restBetweenSets: 75,
        orderIndex: 2,
      },
      {
        name: 'Dumbbell Curl',
        timerConfig: { type: 'countdown', seconds: 60 },
        targetSets: 3,
        targetReps: 12,
        targetWeight: 35,
        restBetweenSets: 60,
        orderIndex: 3,
      },
      {
        name: 'Face Pull',
        timerConfig: { type: 'countdown', seconds: 60 },
        targetSets: 3,
        targetReps: 15,
        targetWeight: 40,
        restBetweenSets: 60,
        orderIndex: 4,
      },
    ],
  },
  {
    name: 'Leg Day',
    description: 'Quads, hamstrings, glutes, calves',
    tags: ['legs', 'strength'],
    suggestedWeekdays: [3], // Wednesday
    estimatedMinutes: 70,
    exercises: [
      {
        name: 'Barbell Squat',
        timerConfig: { type: 'countdown', seconds: 120 },
        targetSets: 4,
        targetReps: 6,
        targetWeight: 225,
        restBetweenSets: 120,
        orderIndex: 0,
      },
      {
        name: 'Romanian Deadlift',
        timerConfig: { type: 'countdown', seconds: 90 },
        targetSets: 3,
        targetReps: 10,
        targetWeight: 185,
        restBetweenSets: 90,
        orderIndex: 1,
      },
      {
        name: 'Leg Press',
        timerConfig: { type: 'countdown', seconds: 75 },
        targetSets: 3,
        targetReps: 12,
        targetWeight: 270,
        restBetweenSets: 75,
        orderIndex: 2,
      },
      {
        name: 'Leg Curl',
        timerConfig: { type: 'countdown', seconds: 60 },
        targetSets: 3,
        targetReps: 12,
        targetWeight: 80,
        restBetweenSets: 60,
        orderIndex: 3,
      },
      {
        name: 'Calf Raise',
        timerConfig: { type: 'countdown', seconds: 45 },
        targetSets: 4,
        targetReps: 15,
        targetWeight: 135,
        restBetweenSets: 45,
        orderIndex: 4,
      },
    ],
  },
  {
    name: 'Upper Body',
    description: 'Full upper body strength',
    tags: ['upper', 'strength'],
    suggestedWeekdays: [5], // Friday
    estimatedMinutes: 65,
    exercises: [
      {
        name: 'Incline Barbell Press',
        timerConfig: { type: 'countdown', seconds: 90 },
        targetSets: 4,
        targetReps: 8,
        targetWeight: 165,
        restBetweenSets: 90,
        orderIndex: 0,
      },
      {
        name: 'Weighted Pull-Up',
        timerConfig: { type: 'countdown', seconds: 90 },
        targetSets: 4,
        targetReps: 6,
        targetWeight: 25,
        restBetweenSets: 90,
        orderIndex: 1,
      },
      {
        name: 'Dumbbell Shoulder Press',
        timerConfig: { type: 'countdown', seconds: 75 },
        targetSets: 3,
        targetReps: 10,
        targetWeight: 55,
        restBetweenSets: 75,
        orderIndex: 2,
      },
      {
        name: 'Cable Row',
        timerConfig: { type: 'countdown', seconds: 60 },
        targetSets: 3,
        targetReps: 12,
        targetWeight: 120,
        restBetweenSets: 60,
        orderIndex: 3,
      },
      {
        name: 'Skullcrusher',
        timerConfig: { type: 'countdown', seconds: 60 },
        targetSets: 3,
        targetReps: 12,
        targetWeight: 65,
        restBetweenSets: 60,
        orderIndex: 4,
      },
      {
        name: 'Hammer Curl',
        timerConfig: { type: 'countdown', seconds: 60 },
        targetSets: 3,
        targetReps: 12,
        targetWeight: 35,
        restBetweenSets: 60,
        orderIndex: 5,
      },
    ],
  },
  {
    name: 'Conditioning',
    description: 'Cardio and metabolic conditioning',
    tags: ['conditioning', 'cardio'],
    suggestedWeekdays: [6], // Saturday
    estimatedMinutes: 45,
    exercises: [
      {
        name: 'Kettlebell Swing',
        timerConfig: { type: 'stopwatch' },
        targetSets: 5,
        targetReps: 20,
        targetWeight: 53,
        restBetweenSets: 60,
        orderIndex: 0,
      },
      {
        name: 'Box Jump',
        timerConfig: { type: 'stopwatch' },
        targetSets: 4,
        targetReps: 10,
        targetWeight: 0,
        restBetweenSets: 60,
        orderIndex: 1,
      },
      {
        name: 'Battle Ropes',
        timerConfig: { type: 'countdown', seconds: 30 },
        targetSets: 4,
        targetReps: 1,
        targetWeight: 0,
        restBetweenSets: 45,
        orderIndex: 2,
      },
      {
        name: 'Sled Push',
        timerConfig: { type: 'stopwatch' },
        targetSets: 3,
        targetReps: 1,
        targetWeight: 90,
        restBetweenSets: 90,
        orderIndex: 3,
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(7 + Math.floor(Math.random() * 4), 0, 0, 0); // 7–10 AM
  return d;
}

function jitter(base: number, pct = 0.1): number {
  return Math.round(base * (1 + (Math.random() * 2 - 1) * pct));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // ── Demo user ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      displayName: 'Demo User',
      preferredUnit: WeightUnit.lbs,
      timezone: 'America/New_York',
    },
  });

  console.log(`✓ Demo user: ${user.email} (id: ${user.id})`);

  // ── Workout templates ─────────────────────────────────────────────────────
  const templates = [];

  for (let i = 0; i < HYBRID_PROGRAM.length; i++) {
    const program = HYBRID_PROGRAM[i];

    // Delete existing to allow re-seeding
    await prisma.workoutTemplate.deleteMany({
      where: { userId: user.id, name: program.name },
    });

    const template = await prisma.workoutTemplate.create({
      data: {
        userId: user.id,
        name: program.name,
        description: program.description,
        tags: program.tags,
        suggestedWeekdays: program.suggestedWeekdays,
        estimatedMinutes: program.estimatedMinutes,
        sortOrder: i,
        exercises: {
          create: program.exercises.map((ex) => ({
            name: ex.name,
            timerConfig: ex.timerConfig,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetWeight: ex.targetWeight,
            weightUnit: WeightUnit.lbs,
            restBetweenSets: ex.restBetweenSets,
            orderIndex: ex.orderIndex,
          })),
        },
      },
      include: { exercises: true },
    });

    templates.push(template);
    console.log(`✓ Template: ${template.name} (${template.exercises.length} exercises)`);
  }

  // ── 2 weeks of fake session history ───────────────────────────────────────
  // Delete existing sessions for demo user
  await prisma.workoutSession.deleteMany({ where: { userId: user.id } });

  // Generate sessions for the past 14 days — skip Thursdays (rest day, weekday 4)
  // Pattern roughly follows the program weekday assignments
  const sessionDays: { daysBack: number; templateIndex: number }[] = [
    { daysBack: 13, templateIndex: 0 }, // Push
    { daysBack: 12, templateIndex: 1 }, // Pull
    { daysBack: 11, templateIndex: 2 }, // Legs
    { daysBack: 9, templateIndex: 3 },  // Upper
    { daysBack: 8, templateIndex: 4 },  // Conditioning
    { daysBack: 6, templateIndex: 0 },  // Push
    { daysBack: 5, templateIndex: 1 },  // Pull
    { daysBack: 4, templateIndex: 2 },  // Legs
    { daysBack: 2, templateIndex: 3 },  // Upper
    { daysBack: 1, templateIndex: 4 },  // Conditioning
  ];

  for (const { daysBack, templateIndex } of sessionDays) {
    const template = templates[templateIndex];
    const startedAt = daysAgo(daysBack);
    const durationSeconds = template.estimatedMinutes * 60 + jitter(300, 0.5);
    const completedAt = new Date(startedAt.getTime() + durationSeconds * 1000);

    // Build exercise logs with sets
    const exerciseLogs: {
      exerciseDefinitionId: string;
      exerciseName: string;
      orderIndex: number;
      timerElapsedSeconds: number;
      sets: {
        setNumber: number;
        reps: number;
        weight: number;
        weightUnit: WeightUnit;
        completedAt: Date;
      }[];
    }[] = template.exercises.map((ex) => {
      const sets = Array.from({ length: ex.targetSets ?? 3 }, (_, i) => ({
        setNumber: i + 1,
        reps: jitter(ex.targetReps ?? 8, 0.15),
        weight: jitter(ex.targetWeight ?? 0, 0.05),
        weightUnit: WeightUnit.lbs,
        completedAt: new Date(startedAt.getTime() + (i + 1) * 90000),
      }));

      return {
        exerciseDefinitionId: ex.id,
        exerciseName: ex.name,
        orderIndex: ex.orderIndex,
        timerElapsedSeconds: (ex.restBetweenSets ?? 90) * (ex.targetSets ?? 3),
        sets,
      };
    });

    // Calculate total volume
    const totalVolume = exerciseLogs.reduce((sum, el) => {
      return sum + el.sets.reduce((s, set) => s + set.weight * set.reps, 0);
    }, 0);

    await prisma.workoutSession.create({
      data: {
        userId: user.id,
        templateId: template.id,
        templateName: template.name,
        startedAt,
        completedAt,
        durationSeconds,
        totalVolume,
        exerciseLogs: {
          create: exerciseLogs.map((el) => ({
            exerciseDefinitionId: el.exerciseDefinitionId,
            exerciseName: el.exerciseName,
            orderIndex: el.orderIndex,
            timerElapsedSeconds: el.timerElapsedSeconds,
            sets: {
              create: el.sets,
            },
          })),
        },
      },
    });

    console.log(`✓ Session: ${template.name} — ${startedAt.toDateString()}`);
  }

  console.log('\n✅ Seed complete!');
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
