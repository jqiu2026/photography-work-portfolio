import { type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { type AnimationName, type AnimationOptions } from "../animation/presets";
export type StaggerProps = AnimationOptions & {
    /** The preset every child plays. Default `fade-up`. */
    animation?: AnimationName;
    /** Milliseconds before the first child. */
    start?: number;
    /** Children are cloned with the animation attributes; text and fragments pass through. */
    children: ReactNode;
};
/**
 * Plays one preset on each child in turn: `<Stagger animation="fade-up" step={60}><Card/><Card/></Stagger>`. It adds
 * `data-hm-anim` and an index to each element child (no wrapper), so it works in server components.
 */
export declare function Stagger({ animation, start, children, step, ...options }: StaggerProps): import("react").JSX.Element;
export type TextRevealProps = AnimationOptions & Omit<HTMLAttributes<HTMLElement>, "children"> & {
    /** The text to reveal. */
    text: string;
    /** Split into `word`s (default) or `char`acters. */
    by?: "word" | "char";
    animation?: AnimationName;
    as?: ElementType;
};
/**
 * Reveals text a word or letter at a time. The full text is the accessible name; the pieces are hidden from assistive
 * technology. Server-compatible.
 */
export declare function TextReveal({ text, by, animation, as: As, step, className, style, duration, delay, easing, count, direction, distance, ...rest }: TextRevealProps): import("react").JSX.Element;
export type MarqueeProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children: ReactNode;
    /** Seconds for one full loop. Default 30. */
    duration?: number;
    reverse?: boolean;
    /** Stop while hovered or focused. Default true. */
    pauseOnHover?: boolean;
    /** Space between items, a spacing step or CSS length. */
    gap?: string;
};
/**
 * A row of content that scrolls endlessly (logos, quotes, tags). The content is repeated once for a seamless loop; the
 * copy is hidden from assistive technology. Stops under reduced motion. Server-compatible.
 */
export declare function Marquee({ children, duration, reverse, pauseOnHover, gap, className, style, ...rest }: MarqueeProps): import("react").JSX.Element;
