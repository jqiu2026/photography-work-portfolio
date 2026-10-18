import type { HTMLAttributes } from "react";
export type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    /** Current value; omit (or pass `undefined`) for an indeterminate bar. */
    value?: number;
    max?: number;
    /** Required: what is progressing. */
    "aria-label": string;
    tone?: "accent" | "success" | "warning" | "danger";
    size?: "sm" | "md";
    /** Show the percentage to the right. */
    showValue?: boolean;
};
/** A linear progress bar. The fill eases to each new value; the indeterminate state is a slow sweep. */
export declare function Progress({ value, max, tone, size, showValue, className, style, ...rest }: ProgressProps): import("react").JSX.Element;
export type CircularProgressProps = Omit<ProgressProps, "size" | "showValue"> & {
    size?: "sm" | "md" | "lg";
    /** Content in the middle (a percentage, an icon). Hidden from assistive tech: the ring carries the value. */
    children?: React.ReactNode;
};
/** A ring. Same semantics as `Progress`; the arc eases to each value. */
export declare function CircularProgress({ value, max, tone, size, className, style, children, ...rest }: CircularProgressProps): import("react").JSX.Element;
