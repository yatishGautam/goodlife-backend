import { beforeAll, afterAll, beforeEach } from 'vitest';
import prisma from '@/config/database';

beforeAll(async () => {
  // Ensure test DB is clean
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean auth-related tables before each test (order matters for FK constraints)
  await prisma.setLog.deleteMany();
  await prisma.exerciseLog.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.exerciseDefinition.deleteMany();
  await prisma.workoutTemplate.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userDevice.deleteMany();
  await prisma.user.deleteMany();
});
