/**
 * API Error Handling Utility
 * Provides consistent error handling for API responses
 * Shows proper user feedback for auth/permission errors
 */

export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: any;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Check if response is an error
 */
export function isApiError(response: any): response is ApiError {
  return response.success === false;
}

/**
 * Handle API response and show appropriate error/success notifications
 */
export async function handleApiResponse<T>(
  response: Response,
  options: {
    showSuccessToast?: boolean;
    successMessage?: string;
    showErrorToast?: boolean;
  } = {}
): Promise<ApiResponse<T>> {
  const {
    showSuccessToast = false,
    successMessage = 'Success',
    showErrorToast = true,
  } = options;

  // Dynamic import to avoid issues in server components
  const { toast } = await import('@/utils/toast');

  // Handle non-OK status codes
  if (!response.ok) {
    // Special handling for auth/permission errors
    if (response.status === 401) {
      if (showErrorToast) {
        toast.error('Your session has expired. Please login again.');
      }
      // Could redirect to login here
      return {
        success: false,
        error: {
          message: 'Unauthorized: Session expired',
          code: 'UNAUTHORIZED',
        },
      };
    }

    if (response.status === 403) {
      if (showErrorToast) {
        toast.error('You do not have permission to perform this action.');
      }
      return {
        success: false,
        error: {
          message: 'Forbidden: Insufficient permissions',
          code: 'PERMISSION_DENIED',
        },
      };
    }

    // Generic error
    let errorData = {
      message: `Error: ${response.status} ${response.statusText}`,
      code: 'API_ERROR',
    };

    try {
      const data = await response.json();
      if (data.error) {
        errorData = data.error;
      }
    } catch {
      // Response is not JSON
    }

    if (showErrorToast) {
      toast.error(errorData.message);
    }

    return {
      success: false,
      error: errorData,
    };
  }

  // Parse successful response
  try {
    const data = await response.json();

    if (data.success === false) {
      // API returned error in success response format
      if (showErrorToast) {
        toast.error(data.error?.message || 'An error occurred');
      }
      return data;
    }

    // Success response
    if (showSuccessToast) {
      toast.success(successMessage);
    }

    return data;
  } catch (error) {
    const errorMsg = 'Failed to parse server response';
    if (showErrorToast) {
      toast.error(errorMsg);
    }
    return {
      success: false,
      error: {
        message: errorMsg,
        code: 'PARSE_ERROR',
      },
    };
  }
}

/**
 * Generic fetch wrapper with error handling
 */
export async function apiFetch<T>(
  url: string,
  options: RequestInit & {
    showSuccessToast?: boolean;
    successMessage?: string;
    showErrorToast?: boolean;
  } = {}
): Promise<ApiResponse<T>> {
  const { showSuccessToast, successMessage, showErrorToast, ...fetchOptions } = options;

  try {
    const response = await fetch(url, fetchOptions);
    return handleApiResponse<T>(response, {
      showSuccessToast,
      successMessage,
      showErrorToast,
    });
  } catch (error) {
    const { toast } = await import('@/utils/toast');
    const errorMsg = error instanceof Error ? error.message : 'Network error';

    if (options.showErrorToast !== false) {
      toast.error(errorMsg);
    }

    return {
      success: false,
      error: {
        message: errorMsg,
        code: 'NETWORK_ERROR',
      },
    };
  }
}
