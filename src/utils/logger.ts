/**
 * Environment-Based Logger Utility
 * Provides conditional logging based on environment
 * Use this instead of direct console.log/error/warn calls
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Logger utility with environment-aware methods
 */
export const logger = {
  /**
   * Debug logs - only in development
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info logs - only in development
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warning logs - always shown
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error logs - always shown
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Conditional log based on environment
   */
  devOnly: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
};

/**
 * Export for backward compatibility
 */
export default logger;
