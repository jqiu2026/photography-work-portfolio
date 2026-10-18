import type { ElementType, HTMLAttributes, ReactNode, Ref } from "react";
export type SurfaceVariant = "section" | "outlined" | "elevated" | "glass" | "holo";
export type SurfaceOwnProps = {
    /** The material. `section` is the default studio treatment: a hairline and room, no box. */
    variant?: SurfaceVariant;
    padding?: "none" | "sm" | "md" | "lg";
    /** Hover lift; use when the whole surface is a link or button. */
    interactive?: boolean;
    /** Pointer light (needs a LightField ancestor). Holo surfaces are always lit. */
    lit?: boolean;
    /** Selected: a thin iridescent edge. */
    selected?: boolean;
    /** Subtle perspective toward the pointer (needs a LightField ancestor; off under reduced motion). */
    tilt?: boolean;
};
export type SurfaceProps = HTMLAttributes<HTMLElement> & SurfaceOwnProps & {
    as?: ElementType;
    asChild?: boolean;
    ref?: Ref<HTMLElement>;
    children?: ReactNode;
};
/** Data attributes for a surface, for components that render their own element. */
export declare function surfaceAttrs({ variant, padding, interactive, lit, selected, tilt }: SurfaceOwnProps): {
    "data-variant": SurfaceVariant;
    "data-padding": "sm" | "md" | "lg" | "none";
    "data-interactive": "" | undefined;
    "data-lit": "" | undefined;
    "data-selected": "" | undefined;
    "data-tilt": "" | undefined;
};
/** The base of every panel, card and overlay. Server-compatible. */
export declare function Surface({ variant, padding, interactive, lit, selected, tilt, as: As, asChild, className, ...rest }: SurfaceProps): import("react").JSX.Element;
