import type { SVGProps } from "react";
export type SparklineProps = Omit<SVGProps<SVGSVGElement>, "data" | "children"> & {
    data: number[];
    /** Names it for assistive tech; without one the sparkline is decorative. */
    "aria-label"?: string;
    tone?: "accent" | "success" | "danger" | "muted";
    width?: number;
    height?: number;
};
/** A tiny trend line for a stat or a table cell. Server-compatible. */
export declare function Sparkline({ data, tone, width, height, className, ...rest }: SparklineProps): import("react").JSX.Element;
