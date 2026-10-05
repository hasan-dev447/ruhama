/** Error thrown by services; endpoints and server actions turn it into a consistent response. */
export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export const errors = {
  unauthorized: () => new ServiceError('UNAUTHORIZED', 'এই কাজের জন্য লগইন করুন।', 401),
  forbidden: (message = 'এই কাজের অনুমতি আপনার নেই।') =>
    new ServiceError('FORBIDDEN', message, 403),
  notFound: (message = 'খুঁজে পাওয়া যায়নি।') => new ServiceError('NOT_FOUND', message, 404),
  invalid: (message = 'তথ্যগুলো ঠিকমতো পূরণ করুন।', details?: unknown) =>
    new ServiceError('VALIDATION_ERROR', message, 422, details),
  conflict: (message: string) => new ServiceError('CONFLICT', message, 409),
  rateLimited: (message = 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।') =>
    new ServiceError('RATE_LIMITED', message, 429),
}

export function isServiceError(err: unknown): err is ServiceError {
  return err instanceof ServiceError
}
