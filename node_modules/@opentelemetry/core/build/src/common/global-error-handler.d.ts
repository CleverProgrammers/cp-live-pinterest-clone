import { Exception } from '@opentelemetry/api';
import { ErrorHandler } from './types';
/**
 * Set the global error handler
 * @param {ErrorHandler} handler
 */
export declare function setGlobalErrorHandler(handler: ErrorHandler): void;
/**
 * Return the global error handler
 * @param {Exception} ex
 */
export declare const globalErrorHandler: (ex: Exception) => void;
//# sourceMappingURL=global-error-handler.d.ts.map