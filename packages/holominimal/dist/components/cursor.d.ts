import { type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { type CursorOptions } from "../interaction/cursor";
export type CursorShape = "dot" | "ring" | "dot-ring" | "crosshair" | "icon" | "none";
export type CursorProps = Omit<CursorOptions, "scope"> & {
    /** What the cursor looks like. `icon` uses `icon` (and `icons`); `none` shows only the spotlight and trail. Default `dot`. */
    shape?: CursorShape;
    /** Your own cursor, centered on the pointer: an icon, an emoji, an image. Used with `shape="icon"`. */
    icon?: ReactNode;
    /** Icons for other states, replacing `icon` while the pointer is over a link or a text field. */
    icons?: {
        link?: ReactNode;
        text?: ReactNode;
    };
    /** Dot (or crosshair) size in px. Default 8. */
    size?: number;
    /** Ring diameter in px. Default 38. */
    ringSize?: number;
    /** Any CSS color. Default: the strong text color. */
    color?: string;
    /** `difference` inverts what is under the cursor, so it stays visible on any background. */
    blend?: "normal" | "difference";
    /** A soft light that follows the cursor: `true` for the default, or its diameter in px. */
    spotlight?: boolean | number;
    /** A solid tail drawn along the path the cursor has taken (any number above 0 turns it on). */
    trail?: number;
    /** Keep the cursor inside this element instead of the whole page. */
    scope?: RefObject<HTMLElement | null>;
    className?: string;
};
/**
 * A custom cursor. It follows the pointer with an exponential ease (so it glides), changes with what is under it
 * (links, text fields, `data-hm-cursor` attributes), and can take any shape: a dot and a trailing ring, a crosshair,
 * or your own icon. Options add a magnetic pull and a ring that morphs to the shape of the button under it, squash and
 * an icon that turns to face where it is going, a spotlight, a trail and press ripples. It lives in
 * the top layer, above dialogs, hides the system cursor, and only runs for a mouse or pen: touch screens keep their
 * normal behavior. Decorative (hidden from assistive technology). Use `CursorArea` to keep it inside one region.
 */
export declare function Cursor({ shape, icon, icons, size, ringSize, color, blend, spotlight, trail, scope, className, smoothing, ringSmoothing, magnetic, morph, rotate, iconPoints, iconAnchors, trailWidth, hideNative, ripple, rippleSize, onStateChange, }: CursorProps): import("react").JSX.Element;
export type CursorAreaProps = HTMLAttributes<HTMLDivElement> & CursorProps;
/** A region with its own cursor: the custom cursor shows (and the system cursor hides) only inside it. */
export declare function CursorArea({ children, className, shape, icon, icons, size, ringSize, color, blend, spotlight, trail, smoothing, ringSmoothing, magnetic, morph, rotate, iconPoints, iconAnchors, trailWidth, hideNative, ripple, rippleSize, onStateChange, ...rest }: CursorAreaProps): import("react").JSX.Element;
