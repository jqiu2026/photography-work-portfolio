import { type HTMLAttributes } from "react";
export type RatingProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
    /** Names the rating (e.g. "Rate this gallery"). */
    "aria-label": string;
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
    max?: number;
    /** Display only. Fractional values draw a partly filled star. */
    readOnly?: boolean;
    size?: "sm" | "md" | "lg";
};
/**
 * A star rating on native radio inputs, so arrow keys, a single tab stop and form posting come for free. Hovering
 * previews the rating and the stars fill with a small spring. `readOnly` shows any value, including halves.
 */
export declare function Rating({ value: controlled, defaultValue, onValueChange, max, readOnly, size, className, ...rest }: RatingProps): import("react").JSX.Element;
