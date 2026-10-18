import { type RefObject } from "react";
import { type LightFieldOptions } from "./light";
import { type ProximityOptions } from "./proximity";
import { type IndicatorOptions } from "./indicator";
import { type SwipeOptions } from "./swipe";
import { type RevealOptions } from "./reveal";
/**
 * React bindings for the interaction engines. Options are read once per mount; pass a `key` (or change a primitive in
 * `deps`) to rebuild. The engines never set React state, so pointer movement causes no re-renders.
 */
export declare function useProximity(ref: RefObject<HTMLElement | null>, options?: ProximityOptions, deps?: unknown[]): void;
export declare function useLightField(ref: RefObject<HTMLElement | null>, options?: LightFieldOptions, deps?: unknown[]): void;
export declare function useReveal(ref: RefObject<HTMLElement | null>, options?: RevealOptions, deps?: unknown[]): void;
export declare function useSwipe(ref: RefObject<HTMLElement | null>, options: SwipeOptions, deps?: unknown[]): void;
export declare function useIndicator(ref: RefObject<HTMLElement | null>, options: IndicatorOptions, deps?: unknown[]): void;
