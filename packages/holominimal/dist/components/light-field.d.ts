import { type HTMLAttributes, type Ref } from "react";
import type { LightFieldOptions } from "../interaction/light";
import type { RevealOptions } from "../interaction/reveal";
export type LightFieldProps = HTMLAttributes<HTMLDivElement> & LightFieldOptions & {
    ref?: Ref<HTMLDivElement>;
};
/**
 * Feeds pointer position to every lit or holo surface inside it (and to an Atmosphere). One listener for the whole
 * region; children stay server components.
 */
export declare function LightField({ selector, tilt, track, ease, ref, ...rest }: LightFieldProps): import("react").JSX.Element;
export type RevealProps = HTMLAttributes<HTMLDivElement> & RevealOptions & {
    ref?: Ref<HTMLDivElement>;
};
/**
 * Reveals `[data-hm-reveal]` descendants (and itself, if marked) as they scroll into view. Stagger siblings with
 * `style={{ "--hm-i": n }}`.
 */
export declare function Reveal({ selector, rootMargin, once, ref, ...rest }: RevealProps): import("react").JSX.Element;
