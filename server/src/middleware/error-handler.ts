import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  // Zod request schema validation error
  if (err instanceof ZodError) {
    const fieldErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: fieldErrors,
    });
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    const target = (err.meta?.target as string[])?.join(', ') || 'field';
    res.status(409).json({
      success: false,
      error: `A record with this ${target} already exists.`,
    });
    return;
  }

  // Prisma record not found (P2025)
  if (err.code === 'P2025') {
    res.status(404).json({
      success: false,
      error: 'Requested record was not found.',
    });
    return;
  }

  // General server error
  console.error('[Unhandled Error]:', err);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
};
