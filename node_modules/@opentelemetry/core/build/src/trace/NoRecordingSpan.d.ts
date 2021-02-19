import { SpanContext, NoopSpan } from '@opentelemetry/api';
/**
 * The NoRecordingSpan extends the {@link NoopSpan}, making all operations no-op
 * except context propagation.
 */
export declare class NoRecordingSpan extends NoopSpan {
    private readonly _context;
    constructor(spanContext: SpanContext);
    context(): SpanContext;
}
//# sourceMappingURL=NoRecordingSpan.d.ts.map