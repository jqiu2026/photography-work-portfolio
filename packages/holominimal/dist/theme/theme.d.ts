import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
/** Named accent hues from the holographic palette. Any hue in degrees works too. */
export declare const accents: {
    readonly cyan: 188;
    readonly blue: 210;
    readonly violet: 268;
    readonly magenta: 322;
    readonly green: 150;
    readonly amber: 38;
};
export type AccentName = keyof typeof accents;
/**
 * Surface treatment for the whole subtree:
 * - `matte`: no translucency, no iridescence (every glass or holo surface renders as an elevated one)
 * - `glass`: translucency and blur, no iridescent edges
 * - `holo`: everything, the default
 */
export type SurfaceTreatment = "matte" | "glass" | "holo";
/** How present the `Atmosphere` backdrop is: `full` (default), `calm` (the color at about a third, the stars dimmed, no drift), or `off`. */
export type AtmospherePreference = "full" | "calm" | "off";
/** `system` follows prefers-reduced-motion; `reduce` turns decorative motion off; `full` keeps it on. */
export type MotionPreference = "system" | "reduce" | "full";
/** `dark` is the default. `dusk` is the dark theme brightened with about 30% of the accent hue. `dawn` is the dark theme in warm colors. All three are dark. */
export type ColorScheme = "dark" | "dusk" | "dawn";
export type ThemeConfig = {
    /** Color scheme for the subtree. Default `dark`. */
    scheme?: ColorScheme;
    /** The accent used for focus, selection and active states: a name or a hue (0-360). */
    accent?: AccentName | number;
    /** Lighting intensity for pointer light, iridescent edges and the atmosphere, 0 (off) to 1.5. Default 1. */
    light?: number;
    surface?: SurfaceTreatment;
    atmosphere?: AtmospherePreference;
    motion?: MotionPreference;
    /** Corner scale: 0 is square, 1 the default, 1.5 softer. */
    radius?: number;
    /** Raw token overrides, e.g. `{ "--hm-bg": "#050507" }`. */
    vars?: Partial<Record<`--hm-${string}`, string>>;
};
/**
 * Converts a theme config into the inline style that applies it. Pure and server-safe: use it on any element, or
 * through the `Theme` component.
 */
export declare function themeStyle(config?: ThemeConfig): CSSProperties;
/** The data attributes a theme config sets (color scheme, surface treatment and motion preference). */
export declare function themeAttributes(config?: ThemeConfig): Record<string, string | undefined>;
export type ThemeProps = HTMLAttributes<HTMLElement> & {
    theme?: ThemeConfig;
    /** Element to render. Use `body` or `html` contents freely; defaults to `div`. */
    as?: ElementType;
    /** Applies the Holominimal base (background, text color, font, focus ring). Default true. */
    base?: boolean;
    children?: ReactNode;
};
/**
 * Scopes Holominimal tokens to a subtree, optionally overriding them. Server-compatible: no hooks, no browser APIs.
 * Nest themes to restyle a region (a different accent for one section, matte surfaces inside a table).
 */
export declare function Theme({ theme, as: As, base, className, style, children, ...rest }: ThemeProps): import("react").JSX.Element;
