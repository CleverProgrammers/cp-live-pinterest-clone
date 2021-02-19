import { Logger } from '@opentelemetry/api';
import { ErrorHandler } from './types';
/**
 * Returns a function that logs an error using the provided logger, or a
 * console logger if one was not provided.
 * @param {Logger} logger
 */
export declare function loggingErrorHandler(logger?: Logger): ErrorHandler;
//# sourceMappingURL=logging-error-handler.d.ts.map