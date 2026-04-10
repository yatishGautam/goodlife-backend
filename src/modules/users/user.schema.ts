import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  preferredUnit: z.enum(['lbs', 'kg']).optional(),
  timezone: z.string().min(1).optional(),
  hapticsEnabled: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
});

export const registerDeviceSchema = z.object({
  deviceType: z.enum(['ios', 'watchos', 'web']),
  deviceName: z.string().max(100).optional(),
  pushToken: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
