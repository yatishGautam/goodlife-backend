import prisma from '@/config/database';
import { calculateStreak } from '@/utils/streak';
import { createError } from '@/middleware/errorHandler';
import type { UpdateProfileInput, RegisterDeviceInput } from './user.schema';
import type { WeightUnit } from '@prisma/client';

type SafeUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  preferredUnit: WeightUnit;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function getProfile(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      preferredUnit: true,
      hapticsEnabled: true,
      soundEnabled: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw createError('User not found', 404, 'NOT_FOUND');
  return user;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<SafeUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.preferredUnit !== undefined && { preferredUnit: input.preferredUnit }),
      ...(input.timezone !== undefined && { timezone: input.timezone }),
      ...(input.hapticsEnabled !== undefined && { hapticsEnabled: input.hapticsEnabled }),
      ...(input.soundEnabled !== undefined && { soundEnabled: input.soundEnabled }),
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      preferredUnit: true,
      hapticsEnabled: true,
      soundEnabled: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function getStats(userId: string) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [streak, totalSessions, weekSessions, volumeResult] = await Promise.all([
    calculateStreak(userId),
    prisma.workoutSession.count({
      where: { userId, completedAt: { not: null }, deletedAt: null },
    }),
    prisma.workoutSession.count({
      where: {
        userId,
        completedAt: { not: null },
        deletedAt: null,
        startedAt: { gte: startOfWeek },
      },
    }),
    prisma.workoutSession.aggregate({
      where: {
        userId,
        completedAt: { not: null },
        deletedAt: null,
        startedAt: { gte: startOfWeek },
      },
      _sum: { totalVolume: true },
    }),
  ]);

  return {
    streak,
    totalSessions,
    sessionsThisWeek: weekSessions,
    volumeThisWeek: volumeResult._sum.totalVolume ?? 0,
  };
}

export async function registerDevice(
  userId: string,
  input: RegisterDeviceInput,
): Promise<void> {
  // Upsert by userId + deviceType (one record per device type per user)
  const existing = await prisma.userDevice.findFirst({
    where: { userId, deviceType: input.deviceType },
  });

  if (existing) {
    await prisma.userDevice.update({
      where: { id: existing.id },
      data: {
        deviceName: input.deviceName,
        pushToken: input.pushToken,
        lastSyncAt: new Date(),
      },
    });
  } else {
    await prisma.userDevice.create({
      data: {
        userId,
        deviceType: input.deviceType,
        deviceName: input.deviceName,
        pushToken: input.pushToken,
      },
    });
  }
}
