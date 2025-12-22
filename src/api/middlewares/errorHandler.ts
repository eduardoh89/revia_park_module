import { Request, Response, NextFunction } from 'express';

import { AppError } from '../../shared/errors/AppError';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('ErrorHandler');

/**
 * Middleware global de manejo de errores
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log del error
  logger.error('Error capturado', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Si es un AppError personalizado
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Error genérico
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? err.message : 'Error interno del servidor',
      ...(isDevelopment && { stack: err.stack }),
    },
  });
};
