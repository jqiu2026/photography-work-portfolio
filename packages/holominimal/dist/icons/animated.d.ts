import type { IconProps } from "./icon";
export type SunMoonMode = "sun" | "moon" | "dawn";
export type SunMoonIconProps = Omit<IconProps, "title"> & {
    /** `true` draws the moon, `false` the sun. Changing it morphs one into the other. Ignored when `mode` is set. */
    moon?: boolean;
    /** `sun`, `moon`, or `dawn` (a half sun rising over a horizon). Changing it morphs between them. */
    mode?: SunMoonMode;
};
/**
 * A sun that becomes a moon. The rays shrink and turn while a second disc slides across the sun and carves a crescent;
 * it plays on every change of `moon` and holds still under reduced motion. Decorative: label the button around it.
 */
export declare function SunMoonIcon({ moon, mode, size, strokeWidth, className, ...rest }: SunMoonIconProps): import("react").JSX.Element;
