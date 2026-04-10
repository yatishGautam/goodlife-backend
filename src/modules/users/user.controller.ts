import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';
import { sendSuccess } from '@/utils/apiResponse';

export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.getProfile(req.user!.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateMeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.updateProfile(req.user!.id, req.body);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function getStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await userService.getStats(req.user!.id);
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function registerDeviceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await userService.registerDevice(req.user!.id, req.body);
    sendSuccess(res, { message: 'Device registered' });
  } catch (err) {
    next(err);
  }
}
