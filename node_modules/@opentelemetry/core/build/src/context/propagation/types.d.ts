import { TextMapPropagator, Logger } from '@opentelemetry/api';
/** Configuration object for composite propagator */
export interface CompositePropagatorConfig {
    /**
     * List of propagators to run. Propagators run in the
     * list order. If a propagator later in the list writes the same context
     * key as a propagator earlier in the list, the later on will "win".
     */
    propagators?: TextMapPropagator[];
    /** Instance of logger */
    logger?: Logger;
}
//# sourceMappingURL=types.d.ts.map