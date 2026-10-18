import { type ButtonHTMLAttributes, type HTMLAttributes } from "react";
export type SegmentedControlProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
    "aria-label": string;
    /** Controlled selected value. */
    value?: string;
    /** Uncontrolled initial value. */
    defaultValue?: string;
    onValueChange?: (value: string) => void;
};
/**
 * A single-choice set of toggle buttons (`aria-pressed`) for filters and pickers that change a view in place.
 * Not for switching panels: that is `Tabs`, which owns tab panels.
 */
export declare function SegmentedControl({ value: controlled, defaultValue, onValueChange, className, ...rest }: SegmentedControlProps): import("react").JSX.Element;
export type SegmentProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
    value: string;
};
export declare function Segment({ value, className, onClick, ...rest }: SegmentProps): import("react").JSX.Element;
