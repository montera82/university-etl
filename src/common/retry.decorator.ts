import { Logger } from '@nestjs/common';

export function Retry(maxAttempts: number, initialDelayMs: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const logger = new Logger(target.constructor.name);

    descriptor.value = async function (...args: any[]) {
      let lastError: Error = new Error('No error occurred');

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error as Error;

          // Calculate delay with exponential backoff
          const delayMs = initialDelayMs * Math.pow(2, attempt - 1);

          logger.warn(
            `Attempt ${attempt}/${maxAttempts} failed for ${propertyKey}: ${error.message}. Retrying in ${delayMs}ms.`,
          );

          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}
