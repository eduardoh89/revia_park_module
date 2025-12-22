/**
 * Clase de error personalizada para la aplicación
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errores específicos
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource}${id ? ` con ID ${id}` : ''} no encontrado`,
      404,
      'NOT_FOUND'
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'PAYMENT_ERROR', details);
  }
}
