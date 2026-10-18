import { type HTMLAttributes, type ReactNode } from "react";
export type DonutDatum = {
    label: string;
    value: number;
};
export type DonutChartProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
    data: DonutDatum[];
    title: ReactNode;
    /** The figure in the middle when nothing is active (a total). Default: the sum. */
    center?: ReactNode;
    format?: Intl.NumberFormatOptions;
    locale?: string;
    empty?: ReactNode;
};
/**
 * A donut with a legend. Each slice and legend row is a button: hovering or focusing either highlights both and puts
 * its label, value and share in the middle. Series colors come from the `--hm-series-*` tokens.
 */
export declare function DonutChart({ data, title, center, format, locale, empty, className, ...rest }: DonutChartProps): import("react").JSX.Element;
