import { type InputHTMLAttributes } from "react";
export type NumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "step" | "role"> & {
    /** Names the field (required unless a visible label is attached with `id`). */
    "aria-label"?: string;
    value?: number | null;
    defaultValue?: number | null;
    onValueChange?: (value: number | null) => void;
    min?: number;
    max?: number;
    step?: number;
    /** Format the shown value (default: plain, trimmed to the step's decimals). */
    format?: (value: number) => string;
};
/**
 * A numeric field with minus and plus buttons. Arrow keys and Page keys step it, Home and End jump to the limits,
 * holding a button repeats, and typed text is parsed and clamped when you leave the field.
 */
export declare function NumberInput({ value: controlled, defaultValue, onValueChange, min, max, step, format, disabled, className, onBlur, onKeyDown, ...rest }: NumberInputProps): import("react").JSX.Element;
