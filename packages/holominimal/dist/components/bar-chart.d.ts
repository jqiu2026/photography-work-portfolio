import { type HTMLAttributes, type ReactNode } from "react";
export type BarDatum = {
    label: string;
    value: number;
};
export type BarChartProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
    data: BarDatum[];
    title: ReactNode;
    /** Shown in the header when no bar is active ("Last 30 days"). */
    caption?: ReactNode;
    /** Number formatting for values (serializable, so a server component can pass it). */
    format?: Intl.NumberFormatOptions;
    locale?: string;
    /** Chart height. Default 9rem. */
    height?: string;
    /** Shown instead of bars when every value is zero or there is no data. */
    empty?: ReactNode;
};
/**
 * The studio revenue chart: thin gray bars that grow in once; the bar under the pointer (or keyboard focus) turns
 * white and its value replaces the caption (announced politely). One tab stop; arrows move between bars.
 */
export declare function BarChart({ data, title, caption, format, locale, height, empty, className, style, ...rest }: BarChartProps): import("react").JSX.Element;
