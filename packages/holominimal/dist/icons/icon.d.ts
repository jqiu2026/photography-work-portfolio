import { type SVGProps } from "react";
import type { AnimationName, AnimationTrigger } from "../animation/presets";
export type IconSize = number | string | "xs" | "sm" | "md" | "lg" | "xl";
export type IconProps = Omit<SVGProps<SVGSVGElement>, "children" | "ref"> & {
    /** A number (px), a CSS length, or a step: xs 12, sm 16, md 20, lg 24, xl 32. Default `1em`, so it follows the text. */
    size?: IconSize;
    /** Line weight in the 24-unit drawing grid. Default 1.75. */
    strokeWidth?: number;
    /** An accessible name. Without one the icon is decorative (`aria-hidden`). */
    title?: string;
    /** Play an animation preset on the icon: `animate="spin"`, `animate="nudge-right"`, `animate="wiggle"`. */
    animate?: AnimationName;
    /** When `animate` plays: `mount` (default), `hover` (the icon), `group` (the nearest button or link, or `[data-hm-group]`), `focus`. */
    animateOn?: AnimationTrigger | "group";
};
/** What an icon is made of: outlined paths, optional solid shapes (dots, fills) and optional faint guide strokes. */
export type IconDefinition = {
    /** Stroked paths (round caps and joins), the body of the icon. */
    d: string[];
    /** Filled shapes with no stroke: dots, solid marks. */
    solid?: string[];
    /** Stroked paths drawn at low opacity (a spinner's track, a hollow ring). */
    faint?: string[];
    /** Stroked paths knocked out of the solid shapes (a letter cut from a badge). */
    cut?: string[];
    /** Filled shapes knocked out of the solid shapes (a play triangle, an eye). */
    cutFill?: string[];
    /** Line weight of `cut`, in grid units. Default 2. */
    cutWidth?: number;
    /** Mirror the whole drawing top to bottom (thumbs down from thumbs up). */
    flipY?: boolean;
    /** Scale the whole drawing about the center (full-bleed brand marks sit at 0.9 to match the line icons). */
    scale?: number;
};
/**
 * Builds an icon component from its drawing. Every Holominimal icon is drawn on a 24-unit grid with round caps and joins
 * and `currentColor`, so it takes the color and size of the text around it. Icons are server-compatible.
 */
export declare function createIcon(name: string, def: IconDefinition): {
    ({ size, strokeWidth, title, className, animate, animateOn, ...rest }: IconProps): import("react").JSX.Element;
    displayName: string;
};
/** Drawing helpers: shapes as path strings, so an icon is one list of paths. */
export declare const circle: (cx: number, cy: number, r: number) => string;
export declare const rect: (x: number, y: number, w: number, h: number, r?: number) => string;
