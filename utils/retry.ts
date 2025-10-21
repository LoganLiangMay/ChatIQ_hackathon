/**
 * Retry Utility
 * Provides retry logic with exponential backoff for failed operations
 */

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        break;
      }

      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );

      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms:`, error);
      
      onRetry?.(attempt, lastError);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Check if an error is retryable (network errors, timeouts, etc.)
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.message?.includes('network') || 
      error.message?.includes('timeout') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('ETIMEDOUT')) {
    return true;
  }

  // HTTP status codes that are retryable
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  if (error.status && retryableStatusCodes.includes(error.status)) {
    return true;
  }

  // Firebase specific errors
  if (error.code === 'unavailable' || 
      error.code === 'deadline-exceeded' ||
      error.code === 'resource-exhausted') {
    return true;
  }

  return false;
}

/**
 * Retry only if the error is retryable
 */
export async function retryIfNeeded<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await retryWithBackoff(fn, {
      ...options,
      maxAttempts: 1, // First attempt
    });
  } catch (error) {
    if (isRetryableError(error)) {
      console.log('Error is retryable, attempting retry...');
      return await retryWithBackoff(fn, options);
    }
    throw error;
  }
}

/**
 * Create a retryable version of an async function
 */
export function makeRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: any[]) => {
    return retryWithBackoff(() => fn(...args), options);
  }) as T;
}

