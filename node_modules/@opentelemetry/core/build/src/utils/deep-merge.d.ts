/**
 * Deeply merges a source object onto a target object.
 * If a given property is an array in both source and target, the
 * source property replaces the target property entirely.
 * @param target
 * @param source
 * @param maxDepth avoids an infinite CPU loop. Defaults to 10.
 * @returns a deeply merged object
 */
export declare function deepMerge(target: Record<string, any>, source: Record<string, any>, maxDepth?: number): Record<string, any>;
//# sourceMappingURL=deep-merge.d.ts.map