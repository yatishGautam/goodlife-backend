import { Request, Response, NextFunction } from 'express';
import * as templateService from './template.service';
import { listTemplatesSchema, importTemplatesSchema } from './template.schema';
import { sendSuccess, sendError } from '@/utils/apiResponse';

export async function listHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = listTemplatesSchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 'VALIDATION_ERROR', 'Invalid query parameters', 400);
      return;
    }
    const templates = await templateService.listTemplates(req.user!.id, query.data);
    sendSuccess(res, templates);
  } catch (err) {
    next(err);
  }
}

export async function getOneHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const template = await templateService.getTemplate(req.user!.id, req.params.id);
    sendSuccess(res, template);
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const template = await templateService.createTemplate(req.user!.id, req.body);
    sendSuccess(res, template, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const template = await templateService.updateTemplate(req.user!.id, req.params.id, req.body);
    sendSuccess(res, template);
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await templateService.deleteTemplate(req.user!.id, req.params.id);
    sendSuccess(res, { message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
}

export async function duplicateHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const template = await templateService.duplicateTemplate(req.user!.id, req.params.id);
    sendSuccess(res, template, 201);
  } catch (err) {
    next(err);
  }
}

export async function importHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = importTemplatesSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'VALIDATION_ERROR', 'Invalid import payload', 400);
      return;
    }
    const templates = await templateService.importTemplates(req.user!.id, parsed.data);
    sendSuccess(res, templates, 201);
  } catch (err) {
    next(err);
  }
}

export async function exportHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const templates = await templateService.exportTemplates(req.user!.id);
    sendSuccess(res, templates);
  } catch (err) {
    next(err);
  }
}

export async function todayHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const template = await templateService.getTodaysSuggestion(req.user!.id);
    sendSuccess(res, template);
  } catch (err) {
    next(err);
  }
}
