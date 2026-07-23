import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

/// Thrown by route handlers to return a specific HTTP status.
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/// Wraps an async handler so thrown errors reach the error middleware.
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(
  fn: T,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Не найдено' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      issues: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  // Prisma "record not found" on update/delete
  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2025') {
    return res.status(404).json({ error: 'Запись не найдена' });
  }
  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
    return res.status(409).json({ error: 'Такая запись уже существует (нарушение уникальности)' });
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}
