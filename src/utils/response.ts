// API Response Utilities

import { NextResponse } from 'next/server';

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

export function successResponse<T>(data: T, statusCode: number = 200) {
  const responseBody: ApiResponse<T> = {
    success: true,
    data,
  };
  
  return NextResponse.json(responseBody, { status: statusCode });
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

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return Response.json(
      errorResponse(error.message, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
  
  return Response.json(
    errorResponse('An unexpected error occurred', 'INTERNAL_ERROR'),
    { status: 500 }
  );
}
