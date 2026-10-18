import { type ElementType, type HTMLAttributes, type Ref } from "react";
import { type AnimationName, type AnimationOptions, type AnimationTrigger } from "../animation/presets";
export type AnimateProps = AnimationOptions & Omit<HTMLAttributes<HTMLElement>, "children"> & {
    /** The preset to play. */
    animation: AnimationName;
    /** When it plays. `mount` (default), `view` (on scrolling into view), `hover`, `focus`, `click` or `manual`. */
    trigger?: AnimationTrigger;
    /** With `view`: play only the first time it enters the viewport. Default true. */
    once?: boolean;
    /** With `view`: how much must be visible, 0 to 1. Default 0.2. */
    threshold?: number;
    /** With `manual`: set to a new value (a number, or `true` after `false`) to play again. */
    play?: boolean | number;
    /** Position in a staggered list: delays by `index` steps. */
    index?: number;
    /** Called when the preset finishes. */
    onAnimationDone?: () => void;
    as?: ElementType;
    ref?: Ref<HTMLElement>;
    children?: React.ReactNode;
};
/**
 * Plays an animation preset on its element, on mount or when a trigger fires:
 *
 *     <Animate animation="fade-up">Hello</Animate>
 *     <Animate animation="pop" trigger="view">Appears when scrolled to</Animate>
 *     <Animate animation="wiggle" trigger="hover" as="button">Hover me</Animate>
 *
 * It renders one element (`as`, a `div` by default). The presets are listed in `animations`. Reduced motion shows the
 * resting state.
 */
export declare function Animate({ animation, trigger, once, threshold, play, index, onAnimationDone, as: As, duration, delay, easing, count, direction, distance, step, className, style, ref, onClick, ...rest }: AnimateProps): import("react").JSX.Element;
/**
 * Imperative animation: `const [ref, play] = useAnimate<HTMLButtonElement>()` then `play("shake")` (for example when a
 * form fails). `play` resolves when the animation ends.
 */
export declare function useAnimate<T extends HTMLElement = HTMLElement>(): readonly [import("react").RefObject<T | null>, (name: AnimationName, options?: AnimationOptions & {
    keep?: boolean;
}) => Promise<void>];
export type CountUpProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    /** The number to count to. It counts from the previous value (from 0 on first show). */
    value: number;
    /** Milliseconds. Default 1200. */
    duration?: number;
    /** `Intl.NumberFormat` options, or a function that formats the number. */
    format?: Intl.NumberFormatOptions | ((n: number) => string);
    /** Locale for the formatting. */
    locale?: string;
    /** Count only once the number is in view. Default true. */
    whenInView?: boolean;
};
/**
 * A number that counts up (or down) to its value with an eased ramp. The final value is the accessible name. Reduced
 * motion shows the final value. The ramp writes the text directly and commits to React state once, at the end, so a
 * count is not a re-render per frame.
 */
export declare function CountUp({ value, duration, format, locale, whenInView, className, ...rest }: CountUpProps): import("react").JSX.Element;
export type TypewriterProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    /** One string, or several to type and erase in turn. */
    text: string | string[];
    /** Milliseconds per character. Default 55. */
    speed?: number;
    /** Milliseconds to hold a finished string before erasing (with several strings or `loop`). Default 1400. */
    hold?: number;
    /** Start over after the last string. Default false for one string, true for several. */
    loop?: boolean;
    /** Show a blinking caret. Default true. */
    cursor?: boolean;
};
/**
 * Types text out a character at a time. The full text is the accessible name; reduced motion shows the first string.
 * It pauses while off screen and carries on from where it was when it comes back.
 */
export declare function Typewriter({ text, speed, hold, loop, cursor, className, ...rest }: TypewriterProps): import("react").JSX.Element;
