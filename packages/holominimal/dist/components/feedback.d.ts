import type { HTMLAttributes } from "react";
export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
    size?: "sm" | "md" | "lg";
    /** Announced to assistive tech. Default "Loading". */
    label?: string;
};
export declare function Spinner({ size, label, className, ...rest }: SpinnerProps): import("react").JSX.Element;
export type SkeletonProps = HTMLAttributes<HTMLSpanElement> & {
    shape?: "text" | "block" | "circle";
    width?: string;
    height?: string;
};
/** A placeholder while content loads. A slow sheen, still under reduced motion. Hidden from assistive tech. */
export declare function Skeleton({ shape, width, height, className, style, ...rest }: SkeletonProps): import("react").JSX.Element;
