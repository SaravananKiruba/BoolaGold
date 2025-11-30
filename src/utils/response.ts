// API Response Utilities

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: any;
}

export function successResponse<T>(data: T, meta?: any): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}

export function errorResponse(message: string, code?: string, details?: any): ApiResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details,
    },
  };
}

export function validationErrorResponse(errors: any): ApiResponse {
  return {
    success: false,
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
    },
  };
}

export function notFoundResponse(resource: string): ApiResponse {
  return {
    success: false,
    error: {
      message: `${resource} not found`,
      code: 'NOT_FOUND',
    },
  };
}

export function unauthorizedResponse(): ApiResponse {
  return {
    success: false,
    error: {
      message: 'Unauthorized access',
      code: 'UNAUTHORIZED',
    },
  };
}
