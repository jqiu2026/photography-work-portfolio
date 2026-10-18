/**
 * Whether motion should be reduced for an element: the OS preference, unless the nearest theme forces
 * `data-hm-motion="full"`, or forced on by `data-hm-motion="reduce"`. Browser-only; call it inside effects.
 */
export declare function prefersReducedMotion(el?: Element | null): boolean;
/** A mouse or trackpad (hover-capable, precise). Touch screens get conventional, non-magnifying behavior. */
export declare function hasFinePointer(): boolean;
export declare const clamp: (v: number, lo: number, hi: number) => number;
