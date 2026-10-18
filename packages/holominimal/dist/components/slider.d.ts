import { type HTMLAttributes } from "react";
export type SliderProps<V extends number | [number, number] = number> = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
    /** Names the slider for assistive tech (required: a slider has no visible text of its own). */
    "aria-label": string;
    min?: number;
    max?: number;
    /** Granularity. The thumb glides between steps rather than jumping. Default 1. */
    step?: number;
    /** A number for one thumb, or `[low, high]` for a range. */
    value?: V;
    defaultValue?: V;
    onValueChange?: (value: V) => void;
    /** Called when a drag or key press ends, for saving. */
    onValueCommit?: (value: V) => void;
    disabled?: boolean;
    /** Show the current value (or range) beside the track. */
    showValue?: boolean;
    /** Format the shown value and `aria-valuetext`. */
    formatValue?: (value: number) => string;
    /** Form field name (a hidden input per thumb: `name` or `name[]` for a range). */
    name?: string;
};
/**
 * A custom slider: pointer, touch and keyboard (arrows, Page keys, Home, End), one thumb or a range. The visual
 * position glides between values with a short eased transition, so dragging and key presses never jump. Each thumb is
 * `role="slider"` with `aria-valuenow/min/max`.
 */
export declare function Slider<V extends number | [number, number] = number>({ min, max, step, value: controlled, defaultValue, onValueChange, onValueCommit, disabled, showValue, formatValue, name, className, style, ...rest }: SliderProps<V>): import("react").JSX.Element;
