/**
 * Helpers for reading caught errors without `any`.
 * Supabase errors are plain objects with `message`/`code`, not always Error instances.
 */
export interface ErrorLike {
  message?: string;
  code?: string;
}

export function asErrorLike(error: unknown): ErrorLike {
  if (typeof error === 'string') return { message: error };
  if (typeof error === 'object' && error !== null) return error as ErrorLike;
  return {};
}

export function errorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  return asErrorLike(error).message || fallback;
}
