import { type HTMLAttributes, type ReactNode } from "react";
import type { BarDatum } from "./bar-chart";
export type LineChartProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
    data: BarDatum[];
    title: ReactNode;
    caption?: ReactNode;
    format?: Intl.NumberFormatOptions;
    locale?: string;
    /** Plot height. Default 9rem. */
    height?: string;
    /** Fill under the line. Default true. */
    area?: boolean;
    /** Smooth (monotone) or straight segments. Default smooth. */
    curve?: "smooth" | "linear";
    empty?: ReactNode;
};
/**
 * A line (or area) chart in the studio's chart language: a hairline grid, the line drawing itself in once, and a marker
 * that glides between points as the pointer or keyboard focus moves. One tab stop; arrows move between points, and
 * each point is announced as "label: value".
 */
export declare function LineChart({ data, title, caption, format, locale, height, area, curve, empty, className, style, ...rest }: LineChartProps): import("react").JSX.Element;
